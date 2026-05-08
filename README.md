# Meeting Room Scheduling

Meeting Room Scheduling is a Next.js application for booking and managing meeting rooms with role-based access and OAuth authentication.

## What this repository contains

- Next.js app built with React 19 and Next 15
- Prisma schema generation for PostgreSQL and SQL Server
- Better Auth integration for GitHub and Microsoft / Azure AD
- Environment validation and build scripts for developer onboarding

## Quick start

1. Clone the repository.
2. Copy `example.env` to `.env`.
3. Install dependencies.
4. Generate Prisma schema and client.
5. Run the app.

### Local development commands

```powershell
Copy-Item .\example.env .\.env -Force
npm ci
npm run build:schema
npm run db:migrate
npm run db:seed
npm run dev
```

Then open `http://localhost:3000`.

## Prerequisites

- Node.js 18.x or 20.x
- npm
- Git

## Environment variables

Copy `example.env` to `.env` and update the values for your environment.

Important vars:

- `NEXT_PUBLIC_BASE_URL` — public app URL without trailing slash
- `NEXT_PUBLIC_SUBFOLDER_PATH` — set to `/path` if the app is hosted under a subfolder; leave blank for root
- `PROXY_STRIPS_PATH` — `true` when a reverse proxy strips the subfolder path before forwarding requests
- `DATABASE_PROVIDER` — `postgresql` or `sqlserver`
- `DATABASE_URL` — Prisma connection string
- `TRUSTED_ORIGINS` — comma-separated allowed origins for auth
- `BETTER_AUTH_SECRET` — auth secret used by Better Auth
- `PRIVATE_INTERNAL_API_KEY` — internal API key used by server-side calls

OAuth vars:

- `GITHUB_ID`, `GITHUB_SECRET`
- `AZURE_AD_CLIENT_ID`, `AZURE_AD_CLIENT_SECRET`, `AZURE_AD_TENANT_ID`

> Note: `NEXT_PUBLIC_BASE_URL` must match the public URL used by OAuth callbacks and app links.

## Local setup

### Install dependencies

```powershell
npm ci
```

### Generate schema and Prisma client

```powershell
npm run build:schema
```

### Run migrations and seed data

```powershell
npm run db:migrate
npm run db:seed
```

### Start development server

```powershell
npm run dev
```

## Build and production

```powershell
npm run build
npm run start
```

## Important scripts

- `npm run build:schema` — generate Prisma schema and client
- `npm run db:migrate` — run migrations using `scripts/db-migrate.ts`
- `npm run db:seed` — seed the database
- `npm run build` — full build pipeline
- `npm run dev` — start Next.js development server
- `npm run start` — start the built production server

## Where to go next

- `DEVELOPMENT.md` — deep developer setup and troubleshooting
- `scripts/env-check.ts` — environment validation rules

## Notes

- This project supports PostgreSQL and SQL Server.
- `NEXT_PUBLIC_SUBFOLDER_PATH` is used in Next.js `basePath`.
- `PROXY_STRIPS_PATH` controls auth callback routing behind proxies.

This README is the onboarding guide. For detailed setup, use `DEVELOPMENT.md`.
