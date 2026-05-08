# Development Guide

This document is the detailed developer reference for building, configuring, and running this application.

## Prerequisites

- **Node.js:** 18.x or 20.x
- **Package Manager:** npm

## Environment variables

Copy the repository sample env file:

```powershell
Copy-Item .\example.env .\.env -Force
```

Then edit `.env` with values for your local environment.

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
- `PROXY_STRIPS_PATH`: If `true`, the app ignores the subfolder path during auth callbacks (use if your proxy strips the path before forwarding).
- `NEXT_PUBLIC_ENVIRONMENT`: `development` toggles GitHub OAuth functions and enables additional logging.

### OAuth Credentials

- **GitHub:** `GITHUB_ID`, `GITHUB_SECRET` - (Active when `NEXT_PUBLIC_ENVIRONMENT` is set to development).
- **Azure AD/Entra ID:** `AZURE_AD_CLIENT_ID`, `AZURE_AD_CLIENT_SECRET`, `AZURE_AD_TENANT_ID`

---

## Technical Workflow

### Database Initialization

This project uses a dynamic schema generator to support multiple database types.

- `npm run build:schema`: Generates `prisma/schema.prisma` from base.schema.prisma and strips provider-specific attributes.
- `npm run db:migrate`: Symlinks `prisma/migrations` to the correct provider folder and runs the migration.
- `npm run db:seed`: Populates initial data.

### Build Pipeline

Running npm run build triggers the following automated sequence:

- Env Check: Validates all variables.
- Schema Gen: Rebuilds Prisma client.
- Next Build: Compiles the React application.
- Scheduler: Bundles background jobs from `jobs/entra-sync/`.
- Standalone: Bundles the app into a `dist/` folder via `scripts/bundle-standalone.ts`.

## Local development workflow

```powershell
# Setup environment
Copy-Item .env.example .env

# Install & Build
npm ci
npm run build:schema  # Generates Prisma client
npm run db:migrate    # Runs migrations
npm run db:seed       # Seeds initial data

# Start
npm run dev  # Verifies Environment Variables before starting Development Server

```

Visit: `http://localhost:3000`

---

## Production Workflow

### Build the app

```powershell
npm run build #Executes build, and copies contents into /dist folder
```

This executes:

- `npm run build:env`
- `npm run build:schema`
- `next build`
- `npm run build:scheduler`
- `tsx scripts/bundle-standalone.ts`

### Copy the contents of /dist and start the production server

```powershell
node server.js
```

---

## Authentication - Azure/Entra ID Configuration

### Microsoft Graph Permissions Required

| Name           | Type        | Description                                         | Admin Consent Required |
| -------------- | ----------- | --------------------------------------------------- | ---------------------- |
| email          | Delegated   | View users' email address                           | No                     |
| offline_access | Delegated   | Maintain access to data you have given it access to | No                     |
| openid         | Delegated   | Sign users in                                       | No                     |
| profile        | Delegated   | View users' basic profile                           | No                     |
| User.Read      | Delegated   | Sign in and read user profile                       | No                     |
| User.Read.All  | Application | Read all users' full profiles                       | Yes                    |
| Mail.Send      | Application | Send mail as any user                               | Yes                    |

### Web and SPA Settings

Implicit grant and hybrid flows

- ID tokens (used for implicit and hybrid flows): `Enabled`
- Allow public client flows: `Enabled`
- Supported Account Types: `Single Tenant Only`

### Redirect URI

Add Web URI's for your server for example.

- http://localhost:3000/api/auth/callback/microsoft
- http://localhost:3000/api/auth/sso/callback/microsoft

> **Note:** `https://login.microsoftonline.com` and `https://graph.microsoft.com` are already configured as trusted origins

### Important Files:

- app/api/admin/register-sso.ts
- app/lib/auth.ts
- app/lib/auth-client.ts

---

## Important scripts

- `npm run build:schema` — generate Prisma schema and client from `base.schema.prisma`
- `npm run db:migrate` — sync migrations and apply them
- `npm run db:seed` — seed data via Prisma
- `npm run build:env` — validate required env vars
- `npm run build` — full build pipeline
- `npm run build:scheduler` — compile scheduled job scripts
- `npm run dev` — start Next.js in development mode
- `npm run start` — start built Next.js app, from `.next` folder not the `/dist` files

## Script details

### `scripts/build-schema.ts`

- Reads `prisma/base.schema.prisma`
- Sets provider based on `DATABASE_PROVIDER`
- Sets query string based on `DATABASE_PROVIDER`
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

### `scripts/build-jobs.ts`

- Bundles scheduled job code from `jobs/entra-sync/entra-sync-process.ts`
- Outputs compiled files into `.next/standalone/jobs`

### `scripts/bundle-standalone.ts`

- Copies the standalone next build output to `dist`
- Includes `.next/static` and `public` assets

---

### Self-Signed Certificates

The repo includes `selfsignedstart` and `selfsignedstartdev` scripts that rely on `NODE_TLS_REJECT_UNAUTHORIZED=0`.

I implemented these for my containers so that I could test my application in different environments.
They are not built for production, the dev version is the exact same thing it just runs on port 3002 so i could have 2 versions running on the same machine.

```powershell
npm run build
npm run selfsignedstart
```
