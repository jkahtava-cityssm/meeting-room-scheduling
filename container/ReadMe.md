# Container Configuration Guide

This directory contains the Docker container setup for the Meeting Room Scheduling application. The setup uses a **single set of base Dockerfiles and docker-compose configuration** with environment-specific behavior controlled via build arguments (`BUILD_ENV`) and environment variables (`.env` files).

## Quick Start

### Development (Local)

```bash
# Build and start all containers with development configuration
make install ENV=dev

# Or from scratch
make init ENV=dev

# Seed the database
make installSeed ENV=dev
```

**Expected behavior:**

- PostgreSQL runs in docker on localhost:5432
- Next.js app runs on http://localhost:3000
- Nginx generates self-signed certificates and runs on http://localhost:80, https://localhost:443
- You'll see browser certificate warnings (expected for self-signed certs)

### Production (Deployment)

```bash
# First, copy and configure the production environment file
cp .env.prod.example .env.prod
# Then edit .env.prod with your production values:
#   - Real database credentials and host
#   - Real domain name (e.g., yourdomain.com)
#   - Real OAuth credentials
#   - Secure secrets

# Ensure Let's Encrypt certificates are provisioned to /etc/letsencrypt/live/yourdomain.com/
# (Use Certbot or similar before starting containers)

# Build and start all containers with production configuration
make install ENV=prod
```

**Expected behavior:**

- Connects to external production database
- Next.js app uses real domain (https://yourdomain.com)
- Nginx uses Let's Encrypt certificates (no browser warnings)
- No self-signed certificate generation

## Environment Configuration

### .env.dev (Development)

Located at `container/.env.dev`, this file provides sensible defaults for local development:

- `BUILD_ENV=dev` — Enables development mode (self-signed certs, localhost)
- `DATABASE_PROVIDER=postgresql` — Uses PostgreSQL for development
- `DATABASE_URL_POSTGRESQL=postgresql://prisma:prisma@postgres:5432/meeting_room_scheduling` — Local docker postgres
- `SERVER_NAME=localhost` — Development domain
- `NEXT_PUBLIC_BASE_URL=http://localhost:3000` — Development URL
- `CERT_DAYS=365` — Self-signed certificate validity (dev only)
- `CERT_*` — Certificate metadata for dev (CA, State, Organization, etc.)

**Usage:** This file is already configured and used by default for development. Edit it if you need to change defaults (e.g., different local credentials).

### .env.prod.example (Production Template)

Located at `container/.env.prod.example`, this is a **template** for production configuration:

```bash
# Copy to .env.prod and fill in all values
cp .env.prod.example .env.prod
# Then edit with your production values
```

**Required values to fill in:**

```bash
# Database
DATABASE_PROVIDER=postgresql              # or sqlserver
DATABASE_URL_POSTGRESQL=postgresql://...  # Your production database URL
DATABASE_HOST=your-database-host
DATABASE_USER_USERNAME=your-db-user
DATABASE_USER_PASSWORD=your-secure-password

# Application
SERVER_NAME=yourdomain.com                # Your production domain
NEXT_PUBLIC_BASE_URL=https://yourdomain.com
BETTER_AUTH_SECRET=your-generated-secret  # Generate with: openssl rand -base64 32

# OAuth Providers
GITHUB_ID=your-github-app-id
AZURE_AD_CLIENT_ID=your-azure-app-id
AZURE_AD_TENANT_ID=your-azure-tenant-id
...
```

**Important:** Never commit `.env.prod` to version control—it contains sensitive credentials.

## Build Environment Modes

The `BUILD_ENV` argument controls how containers are built and behave:

### Development Mode (BUILD_ENV=dev)

- **Node.js TLS:** `NODE_TLS_REJECT_UNAUTHORIZED=0` (allows self-signed certs)
- **Nginx Certificates:** Generates self-signed certificates at startup
- **Database:** Expects local Docker PostgreSQL on localhost:5432
- **URLs:** http://localhost:3000
- **Use case:** Local development, testing, debugging

**Dockerfile changes for dev:**

- `Dockerfile.nextjs-app`: Sets `NODE_TLS_REJECT_UNAUTHORIZED=0`
- `Dockerfile.nginx`: Passes `BUILD_ENV=dev` to startup script

**Nginx startup behavior for dev:**

- Generates self-signed certificates if not present
- Creates DH parameters for SSL
- Redirects HTTP → HTTPS using self-signed certs

### Production Mode (BUILD_ENV=prod)

- **Node.js TLS:** `NODE_TLS_REJECT_UNAUTHORIZED=1` (enforces valid certs)
- **Nginx Certificates:** Expects Let's Encrypt certificates at `/etc/letsencrypt/live/${SERVER_NAME}/`
- **Database:** Connects to external production database
- **URLs:** https://yourdomain.com
- **Use case:** Production deployment, staging environments

**Dockerfile changes for prod:**

- `Dockerfile.nextjs-app`: Does NOT set `NODE_TLS_REJECT_UNAUTHORIZED` (default secure mode)
- `Dockerfile.nginx`: Passes `BUILD_ENV=prod` to startup script

**Nginx startup behavior for prod:**

- Expects Let's Encrypt certificates to already exist
- Fails gracefully with HTTP-only fallback if certs not found
- Logs warning about missing certificates

## Docker Compose Configuration

The single `docker-compose.yml` file is environment-agnostic:

- **Services:** postgres, prisma-migrate, prisma-seed, nextjs-app, nginx
- **Build args:** All services receive `BUILD_ENV` at build time
- **Environment vars:** All services receive values from `.env.${ENV}` file
- **Profiles:** Support selective startup (init, install-db, install-app, install-nginx, seed, migrate)

### Service Configuration

#### postgres

- Always PostgreSQL 15 (production should connect to external database)
- Environment variables from `.env.${ENV}` for credentials
- Volume-backed for data persistence

#### prisma-migrate

- Runs Prisma migrations
- Environment: `DATABASE_URL` (set to `${DATABASE_URL_POSTGRESQL}` in docker-compose)
- Profile: `migrate`, `init`, `dev`, `install-db`

#### prisma-seed

- Seeds database with initial data
- Environment variables for database connection and admin email
- Profile: `seed`, `dev`
- **Note:** LINKED\_\* variables removed (infrastructure-specific, should be injected separately)

#### nextjs-app

- Next.js application server (port 3000)
- Environment variables from `.env.${ENV}` (OAuth, auth secrets, base URL, etc.)
- Conditionally built with `NODE_TLS_REJECT_UNAUTHORIZED` based on `BUILD_ENV`
- Depends on postgres and nginx

#### nginx

- Nginx reverse proxy (ports 80, 443)
- Environment: `BUILD_ENV`, `SERVER_NAME`, `CERT_*` metadata
- Startup script reads `BUILD_ENV` and configures appropriately (self-signed vs Let's Encrypt)
- Profiles: `app`, `init`, `dev`, `install-app`, `install-nginx`

## Using the Makefile

The `container/Makefile` has been updated to support environment selection:

```bash
# Development (default)
make install              # Uses ENV=dev by default
make init ENV=dev
make installMigrate ENV=dev
make installApp ENV=dev
make installSeed ENV=dev

# Production
make install ENV=prod
make init ENV=prod
```

### Makefile Targets

- **`init`** – Start base services (postgres) with profile `init`
- **`install`** – Full setup: install DB, nginx, and app with profile `install-db`, `install-nginx`, `install-app`
- **`installMigrate`** – Database migration only (profile `install-db`)
- **`installApp`** – App container only (profile `install-app`)
- **`installSeed`** – Database seeding (profile `seed`)

All targets automatically:

1. Select the correct `.env.${ENV}` file
2. Pass `BUILD_ENV=${ENV}` as a build argument to all services
3. Use `docker-compose.yml` as the base configuration

## Dockerfile Modifications

### Dockerfile.nextjs-app

**Key change:** Build argument `BUILD_ENV` controls whether `NODE_TLS_REJECT_UNAUTHORIZED` is set.

```dockerfile
ARG BUILD_ENV=dev

RUN if [ "$BUILD_ENV" = "dev" ]; then echo "Development mode"; fi
ENV NODE_TLS_REJECT_UNAUTHORIZED=${BUILD_ENV_NODE_TLS_REJECT_UNAUTHORIZED:-1}
```

- **Dev:** Sets to `0` (allows self-signed certs)
- **Prod:** Defaults to `1` (secure mode, rejects invalid certs)

### Dockerfile.nginx

**Key change:** Build argument `BUILD_ENV` passed to startup script as environment variable.

```dockerfile
ARG BUILD_ENV=dev
ENV BUILD_ENV=${BUILD_ENV}
```

The startup script (`container/nginx/startup.sh`) then reads `BUILD_ENV` and configures appropriately.

### Dockerfile.prisma-migrate & Dockerfile.prisma-seed

No changes—build args passed through but not used (services are environment-agnostic).

## Nginx Configuration Files

### Development (Self-Signed)

- **startup.sh logic:** Generates self-signed certificates if not present, sets up DH parameters
- **full.conf.template:** Uses `/etc/nginx/certs/selfsigned.crt` and `/etc/nginx/certs/selfsigned.key`
- **http-only.conf.template:** HTTP-only fallback if certificate generation fails

### Production (Let's Encrypt)

- **startup.sh logic:** Expects certificates at `/etc/letsencrypt/live/${SERVER_NAME}/`
- **prod.full.conf.template:** Uses `/etc/letsencrypt/live/${SERVER_NAME}/fullchain.pem` and `/etc/letsencrypt/live/${SERVER_NAME}/privkey.pem`
- **http-only.conf.template:** HTTP-only fallback if Let's Encrypt certificates not found

**Important:** Before deploying to production, ensure Let's Encrypt certificates are provisioned:

```bash
# Using Certbot (example)
certbot certonly --webroot -w /path/to/webroot -d yourdomain.com
```

The certificates must be available at `/etc/letsencrypt/live/yourdomain.com/` before starting containers in production mode.

## Environment Variables Reference

### Valid Environment Variables (from example.env)

All variables below should be defined in `.env.dev` or `.env.prod`:

```bash
# Database
DATABASE_PROVIDER=postgresql              # or sqlserver
DATABASE_URL_POSTGRESQL=postgresql://...  # PostgreSQL connection string
DATABASE_URL_SQLSERVER=sqlserver://...    # SQL Server connection string (if using sqlserver)
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_NAME=meeting_room_scheduling
DATABASE_USER_USERNAME=prisma
DATABASE_USER_PASSWORD=prisma
ADMIN_USER_EMAIL=user@user.ca

# Application
SERVER_NAME=localhost                     # Domain or hostname
NEXT_PUBLIC_BASE_URL=http://localhost:3000
NEXT_PUBLIC_SUBFOLDER_PATH=
NEXT_PUBLIC_ENVIRONMENT=development
BETTER_AUTH_URL=http://localhost:3000
BETTER_AUTH_SECRET=secret
PRIVATE_INTERNAL_API_KEY=api-key
TRUSTED_ORIGINS=http://localhost:3000

# OAuth
GITHUB_ID=your-github-id
GITHUB_SECRET=your-github-secret
AZURE_AD_CLIENT_ID=your-azure-id
AZURE_AD_CLIENT_SECRET=your-azure-secret
AZURE_AD_TENANT_ID=your-tenant-id

# Nginx (Development)
CERT_DAYS=365
CERT_COUNTRY=CA
CERT_STATE=Ontario
CERT_LOCALITY='Sault Ste. Marie'
CERT_ORG=Dev
CERT_OU=IT
```

### Invalid/Removed Variables

The following variables are **no longer used** (removed from docker-compose.yml):

- `CONTAINER_DB_URL` – Replaced with `DATABASE_URL_POSTGRESQL` or `DATABASE_URL_SQLSERVER`
- `DATABASE_URL_ADMIN` – Not needed; use standard database credentials
- `LINKED_SERVER`, `LINKED_SERVER_NAME`, `LINKED_DATABASE_NAME`, `LINKED_USERNAME`, `LINKED_PASSWORD` – Removed (infrastructure-specific; should be injected separately if needed)

If your application needs these variables, they must be injected into containers separately (e.g., via environment variables passed directly to running containers or job processes).

## Troubleshooting

### Development Mode Issues

**"Cannot verify certificate" errors in browser:**

- Expected for self-signed certificates
- Click "Advanced" → "Proceed to localhost" (or equivalent in your browser)
- Verify self-signed cert was generated in nginx logs: `docker logs nginx`

**"Self-signed certificate generation failed":**

- Check if `container/nginx/startup.sh` has correct permissions: `chmod +x container/nginx/startup.sh`
- Verify openssl is available in nginx container
- Check docker logs: `docker logs nginx`

**Database connection errors:**

- Verify postgres is running: `docker-compose ps postgres`
- Check .env.dev has correct credentials: `prisma:prisma` (defaults)
- Verify docker network `webnet` exists: `docker network ls`

### Production Mode Issues

**"Let's Encrypt certificates not found":**

- Production containers expect certificates at `/etc/letsencrypt/live/${SERVER_NAME}/`
- Ensure Certbot or similar has provisioned certificates **before** starting containers
- Check if mounted correctly in docker-compose or docker run commands
- Review startup logs: `docker logs nginx`

**"NODE_TLS_REJECT_UNAUTHORIZED warnings":**

- Production Dockerfiles should NOT set this variable
- If seeing warnings, verify `BUILD_ENV=prod` was passed at build time
- Rebuild containers with correct `BUILD_ENV`: `make install ENV=prod`

**Database connection to production DB:**

- Verify `DATABASE_URL_POSTGRESQL` or `DATABASE_URL_SQLSERVER` in `.env.prod` is correct
- Test connectivity from your local machine: `psql <url>` or similar
- Check firewall rules and network routing to production database

## Files and Structure

```
container/
├── Makefile                          # Makefile with ENV parameter support
├── docker-compose.yml                # Single base compose file (updated from local.docker-compose.merged.yml)
├── .env.dev                          # Development environment (with defaults)
├── .env.dev.example                  # Development template for reference
├── .env.prod.example                 # Production template (TEMPLATE ONLY)
├── Dockerfile.nextjs-app             # Next.js Dockerfile (updated with BUILD_ENV arg)
├── Dockerfile.nginx                  # Nginx Dockerfile (updated with BUILD_ENV arg)
├── Dockerfile.prisma-migrate         # Prisma migration Dockerfile (unchanged)
├── Dockerfile.prisma-seed            # Prisma seed Dockerfile (unchanged)
├── nginx/
│   ├── startup.sh                    # Smart startup script (dev vs prod logic)
│   ├── full.conf.template            # HTTPS config (dev - self-signed cert paths)
│   ├── prod.full.conf.template       # HTTPS config (prod - Let's Encrypt cert paths)
│   ├── http-only.conf.template       # HTTP-only fallback config
│   ├── nginx.conf.template           # Base nginx config
│   └── local.startup.sh              # Archived (dev startup script for reference)
└── README.md                         # This file
```

## Migration from Old Setup

If migrating from the old `local.docker-compose.merged.yml` setup:

1. **Old Makefile referenced:** `local.docker-compose.merged.yml`, `--env-file ../.env.docker`
2. **New Makefile references:** `docker-compose.yml`, `--env-file .env.${ENV}`
3. **Old Dockerfiles:** `Dockerfile.local.nextjs-app`, `Dockerfile.local.nginx`
4. **New Dockerfiles:** `Dockerfile.nextjs-app`, `Dockerfile.nginx` (with BUILD_ENV support)
5. **Old environment:** `.env.docker` (external file)
6. **New environments:** `.env.dev`, `.env.prod` (in `container/` directory)

**To migrate:**

1. Use new `.env.dev` instead of old `.env.docker`
2. Use `make install ENV=dev` instead of `make install`
3. Update any CI/CD pipelines to use `ENV=prod` for production
4. Ensure `.env.prod` is configured before production deployment

## Further Customization

### Custom Certificate Metadata (Development)

Edit `.env.dev` to customize the self-signed certificate:

```bash
CERT_DAYS=730          # 2 years instead of 1
CERT_STATE=Quebec      # Different state
CERT_LOCALITY=Montreal
CERT_ORG=MyCompany
CERT_OU=Engineering
```

### Custom Server Names (Development)

For testing multiple domains locally, set `SERVER_NAME`:

```bash
# In .env.dev
SERVER_NAME=app.local,api.local,localhost
```

The startup script will create a certificate with Subject Alternative Names (SANs) for all domains.

### Database Provider Changes (Development)

To test with SQL Server instead of PostgreSQL (in development):

```bash
# In .env.dev
DATABASE_PROVIDER=sqlserver
DATABASE_URL_SQLSERVER=sqlserver://localhost:1433;database=meeting_room_scheduling;...
```

Update docker-compose to use SQL Server container, or connect to external SQL Server instance.

---

**Questions?** Check the Makefile targets, environment file examples, or review the startup script logic in `container/nginx/startup.sh`.
