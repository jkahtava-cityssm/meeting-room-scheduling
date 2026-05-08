# Meeting Room Scheduling

Meeting Room Scheduling is a Next.js application for booking and managing meeting rooms with role-based access and OAuth authentication.

## Quick Start

```powershell
# Setup environment
Copy-Item .env.example .env

# Install & Build
npm ci
npm run build:schema  # Generates Prisma client
npm run db:migrate    # Runs migrations
npm run db:seed       # Seeds initial data

# Start
npm run dev

```

Visit: `http://localhost:3000`

---

## Tech Stack & Prerequisites

- **Framework:** Next.js 15 (React 19)
- **ORM:** Prisma (PostgreSQL & SQL Server support)
- **Auth:** Better Auth (GitHub or Azure AD / Microsoft Entra)
- **Runtime:** Node.js 18.x or 20.x

---

## Configuration

Update `.env` with your local settings. Key variables include:

### Core

- `NEXT_PUBLIC_BASE_URL`: Public app URL (no trailing slash) `http://localhost:3000`.
- `BETTER_AUTH_SECRET`: Random string for session encryption (RSA256 STRING).
- `PRIVATE_INTERNAL_API_KEY`: Internal API key used by server-side calls (RSA256 STRING).
- `TRUSTED_ORIGINS`: Comma-separated list of trusted domains, e.g., `http://localhost:3000`

### Database

- `DATABASE_PROVIDER`: `postgresql` or `sqlserver`.
- `DATABASE_NAME`: Name of your database.
- `DATABASE_HOST`: IP Address or Hostname of the database server.
- `DATABASE_PORT`: `5432` (Postgres) or `1433` (SQL Server).
- `DATABASE_USER_USERNAME`: Database Username (requires Admin permissions for the first migration).
- `DATABASE_USER_PASSWORD`: Database User Password

### Deployment & Proxy

- `NEXT_PUBLIC_SUBFOLDER_PATH`: Set if hosting under a subfolder (e.g., `/apps/rooms`).
- `PROXY_STRIPS_PATH`: Set to `true` if your reverse proxy strips subfolder paths.
- `NEXT_PUBLIC_ENVIRONMENT`: `development` toggles GitHub OAuth functions and enables additional logging.

### OAuth Credentials

- **GitHub:** `GITHUB_ID`, `GITHUB_SECRET` - (Active when `NEXT_PUBLIC_ENVIRONMENT` is set to development).
- **Azure AD:** `AZURE_AD_CLIENT_ID`, `AZURE_AD_CLIENT_SECRET`, `AZURE_AD_TENANT_ID`

---

## Available Scripts

| Command                | Action                                                    |
| ---------------------- | --------------------------------------------------------- |
| `npm run build:schema` | Generates the Prisma schema and client based on provider. |
| `npm run db:migrate`   | Executes database migrations via `scripts/db-migrate.ts`. |
| `npm run db:seed`      | Populates the database with initial records.              |
| `npm run dev`          | Spins up the local development server.                    |
| `npm run build`        | Runs the full production build pipeline.                  |
| `npm run start`        | Starts the production-ready server.                       |

---

## Documentation & Resources

- **[DEVELOPMENT.md](https://www.google.com/search?q=./DEVELOPMENT.md):** Deep-dive into architecture, troubleshooting, and advanced setup.

> **Note:** Ensure `NEXT_PUBLIC_BASE_URL` exactly matches your OAuth provider's registered callback URL.
