# Development Guide

This document is the detailed developer reference for building, configuring, and running this application.

## Prerequisites

- Node.js 18.x or 20.x
- npm
- Git

## Environment variables

Copy the repository sample env file:

```powershell
Copy-Item .\example.env .\.env -Force
```

Then edit `.env` with values for your local environment.

### Required env vars

- `NEXT_PUBLIC_BASE_URL` — public app URL, without trailing slash
- `NEXT_PUBLIC_SUBFOLDER_PATH` — path prefix if app is hosted in a subfolder, otherwise leave blank
- `PRIVATE_INTERNAL_API_KEY` — internal API key used by server-side code
- `BETTER_AUTH_SECRET` — security secret for Better Auth
- `TRUSTED_ORIGINS` — comma-separated list of allowed auth origins
- `ADMIN_USER_EMAIL` — seed admin user email
- `DATABASE_PROVIDER` — `postgresql` or `sqlserver`
- `DATABASE_NAME`
- `DATABASE_HOST`
- `DATABASE_PORT`
- `DATABASE_USER_USERNAME`
- `DATABASE_USER_PASSWORD`
- `AZURE_AD_CLIENT_ID`
- `AZURE_AD_CLIENT_SECRET`
- `AZURE_AD_TENANT_ID`

### Optional auth vars

- `GITHUB_ID`
- `GITHUB_SECRET`

## Env validation

Use the built-in env validation script before building:

```powershell
npm run build:env
```

This checks:

- `NEXT_PUBLIC_BASE_URL` is present and has no trailing slash
- `NEXT_PUBLIC_SUBFOLDER_PATH` either starts with `/` or is blank
- required auth, database, and admin env vars are set

## How env vars affect the app

### Base URL and routing

- `NEXT_PUBLIC_BASE_URL` is used for auth callback URLs and public links
- `NEXT_PUBLIC_SUBFOLDER_PATH` is also used as Next.js `basePath`
- `PROXY_STRIPS_PATH` controls whether the proxy removes the subfolder path before forwarding requests

If you host the app at root:

```env
NEXT_PUBLIC_SUBFOLDER_PATH=
```

If the app is hosted in `/app`:

```env
NEXT_PUBLIC_SUBFOLDER_PATH=/app
```

### Database provider

The repository supports both SQL Server and PostgreSQL.

Set `DATABASE_PROVIDER` to `sqlserver` or `postgresql`.

The `build-schema.ts` script generates `prisma/schema.prisma` with the matching provider.

### OAuth providers

- GitHub config uses `GITHUB_ID` and `GITHUB_SECRET`
- Microsoft/Azure AD config uses `AZURE_AD_CLIENT_ID`, `AZURE_AD_CLIENT_SECRET`, and `AZURE_AD_TENANT_ID`

If you do not configure OAuth provider values, those login options will not be available.

## Local development workflow

### 1. Install dependencies

```powershell
npm ci
```

### 2. Generate Prisma schema and client

```powershell
npm run build:schema
```

This runs `scripts/build-schema.ts` and writes `prisma/schema.prisma` using your selected `DATABASE_PROVIDER`.

### 3. Run migrations

```powershell
npm run db:migrate
```

This command performs `npm run build:schema` and then runs `tsx scripts/db-migrate.ts dev`.

### 4. Seed the database

```powershell
npm run db:seed
```

### 5. Start development server

```powershell
npm run dev
```

Then open `http://localhost:3000`.

## Full build and production run

### Build the app

```powershell
npm run build
```

This executes:

- `npm run build:env`
- `npm run build:schema`
- `next build`
- `npm run build:scheduler`
- `tsx scripts/bundle-standalone.ts`

### Start the production server

```powershell
npm run start
```

### Running with self-signed certificates

The repo includes `selfsignedstart` and `selfsignedstartdev` scripts that rely on `NODE_TLS_REJECT_UNAUTHORIZED=0`.

In PowerShell:

```powershell
$env:NODE_TLS_REJECT_UNAUTHORIZED = '0'
npm run start
Remove-Item Env:\NODE_TLS_REJECT_UNAUTHORIZED
```

## Database provider notes

### PostgreSQL

Example `DATABASE_URL`:

```env
DATABASE_URL=postgresql://${DATABASE_USER_USERNAME}:${DATABASE_USER_PASSWORD}@${DATABASE_HOST}:${DATABASE_PORT}/${DATABASE_NAME}
```

### SQL Server

Example `DATABASE_URL`:

```env
DATABASE_URL=sqlserver://${DATABASE_HOST}:${DATABASE_PORT};database=${DATABASE_NAME};user=${DATABASE_USER_USERNAME};password=${DATABASE_USER_PASSWORD};encrypt=true;trustServerCertificate=true
```

## Important scripts

- `npm run build:schema` — generate Prisma schema and client from `base.schema.prisma`
- `npm run db:migrate` — sync migrations and apply them
- `npm run db:seed` — seed data via Prisma
- `npm run build:env` — validate required env vars
- `npm run build` — full build pipeline
- `npm run build:scheduler` — compile scheduled job scripts
- `npm run dev` — start Next.js in development mode
- `npm run start` — start built Next.js app

## Script details

### `scripts/build-schema.ts`

- Reads `prisma/base.schema.prisma`
- Sets provider based on `DATABASE_PROVIDER`
- Writes `prisma/schema.prisma`
- Removes SQL Server-specific `@db.*` attributes when using PostgreSQL

### `scripts/db-migrate.ts`

- Uses `DATABASE_PROVIDER` to select migration source folder
- Creates a symlink from `prisma/migrations` to either `prisma/migrations-postgresql` or `prisma/migrations-sqlserver`
- Runs `npx prisma migrate dev` or `deploy` depending on command

### `scripts/env-check.ts`

- Validates required env vars
- Ensures `NEXT_PUBLIC_BASE_URL` has no trailing slash
- Ensures `NEXT_PUBLIC_SUBFOLDER_PATH` is either blank or starts with `/` and does not end with `/`

### `scripts/build-scheduler.ts`

- Bundles scheduled job code from `jobs/entra-sync/entra-sync-process.ts`
- Outputs compiled files into `.next/standalone/jobs`

### `scripts/bundle-standalone.ts`

- Copies the standalone next build output to `dist`
- Includes `.next/static` and `public` assets

## Auth and proxy guidance

The app uses Better Auth with social login providers.

- `NEXT_PUBLIC_BASE_URL` is used in auth redirect URLs
- `NEXT_PUBLIC_SUBFOLDER_PATH` is used for `basePath`
- `PROXY_STRIPS_PATH=true` if the proxy removes the subfolder before forwarding requests

If you see auth callback failures, verify these three values and ensure `TRUSTED_ORIGINS` includes your app URL.

## Troubleshooting

- If `npm run build:env` fails, fix the reported missing env vars
- If Prisma complains about `DATABASE_URL`, verify the connection string format and database reachability
- If migrations fail, confirm the database user has create/alter privileges
- If login redirects fail, verify `NEXT_PUBLIC_BASE_URL`, `NEXT_PUBLIC_SUBFOLDER_PATH`, and `TRUSTED_ORIGINS`
- On Windows, use PowerShell-style env assignment for temporary env vars

## Useful command summary

```powershell
Copy-Item .\example.env .\.env -Force
npm ci
npm run build:env
npm run build:schema
npm run db:migrate
npm run db:seed
npm run dev
```

For production packaging:

```powershell
npm run build
npm run start
```

For Docker:

```powershell
docker compose -f .\container\docker-compose.yml up -d postgres
# or full stack
docker compose -f .\container\docker-compose.yml up --build -d
```

## References

- `README.md` — onboarding summary
- `container/example.env` — Docker env example
- `scripts/env-check.ts` — required env validation
- `container/docker-compose.yml` — full-stack container configuration
