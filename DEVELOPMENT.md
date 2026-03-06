How to build this workspace (PowerShell-friendly)
Below are minimal steps to get the app running locally in two common flows: a) local dev (fast, recommended for development) and b) docker-based full-stack (recommended if you want the same DB container used here).

Prereqs (recommended)

- Install Node.js 18.x or 20.x (nvm/nvm-windows works well). Next 15 + React 19 work fine on Node >=18.
- Install Docker Desktop if you plan to use the provided docker-compose files.
- Ensure Git is installed if you need to clone or switch branches.

1. Prepare environment variables

- Copy the sample env to .env and edit values (especially DATABASE_URL). In PowerShell:

```powershell
Copy-Item -Path .\example.env -Destination .\.env -Force
# Then open .env in your editor and set DATABASE_URL, DATABASE_USER_PASSWORD, etc.
```

- Common variables to set:
  - DATABASE_URL (Postgres connection string e.g. postgresql://user:pass@localhost:5432/meeting_room_scheduling)
  - DATABASE_USER_USERNAME, DATABASE_USER_PASSWORD (used by container)
  - SERVER_NAME / DUCKDNS_TOKEN (only if you use the container nginx/certbot setup)

2. Install dependencies

- From repo root in PowerShell:

```powershell
npm ci
```

(use `npm install` if you prefer, but `npm ci` uses package-lock.json for reproducible installs)

3. Database: quick local dev (recommended)

- If you have a local Postgres instance running and set DATABASE_URL in .env, run Prisma generate + dev migrations and seed:

```powershell
# generate client
npx prisma generate

# apply migrations for development (creates migrations and updates DB)
npx prisma migrate dev --name init

# run seed script configured in package.json (this uses prisma.seed entry)
npx prisma db seed
```

Notes:

- For local dev you can also use `npx prisma db push` to push the schema without creating migration files. `migrate dev` is the standard dev flow.
- If you prefer a production-style deploy of migrations, use `npx prisma migrate deploy` (after building in CI/CD).

4. Database: using Docker (if you don't have Postgres installed)

- Start just the Postgres service from the project's container compose (recommended for local testing):

```powershell
# start Postgres only
docker compose -f .\container\docker-compose.yml up -d postgres

# wait until Postgres becomes ready (pg_isready inside the container), then:
npx prisma generate
npx prisma migrate dev --name init
npx prisma db seed
```

- To run the full stack via Docker (production-ish):

```powershell
# builds and brings up services declared in container/docker-compose.yml (postgres, prisma-migrate, nextjs-app, nginx, etc.)
docker compose -f .\container\docker-compose.yml up --build -d
```

Caveat: the full docker setup expects SERVER_NAME and other environment variables for nginx/certbot; check .env under example.env and edit accordingly.

5. Build Next.js (production build)

- After migrations and generating Prisma client:

```powershell
npm run build
```

6. Start the app

- Development server (live reload):

```powershell
npm run dev
# opens at http://localhost:3000
```

- Production start (after build):

```powershell
npm run start
```

Windows-specific note about `dev-start`

- The repo contains a `dev-start` script that does `NODE_TLS_REJECT_UNAUTHORIZED=0 next start` (POSIX env assignment). On PowerShell set it like this before running start:

```powershell
$env:NODE_TLS_REJECT_UNAUTHORIZED = '0'
npm run start
# Optionally clear:
Remove-Item Env:\NODE_TLS_REJECT_UNAUTHORIZED
```

If you want the script to work cross-platform, add `cross-env` and change script to:

- install: `npm install --save-dev cross-env`
- script: `"dev-start": "cross-env NODE_TLS_REJECT_UNAUTHORIZED=0 next start"`

Useful verification and lint

- Lint: `npm run lint`
- Visit: http://localhost:3000 after `npm run dev` (or whichever port you expose)
- Quick smoke test: open browser and verify app loads, or `curl http://localhost:3000` in PowerShell

Troubleshooting tips

- Prisma complains about DATABASE_URL: confirm .env path and the value format (postgresql://user:pass@host:5432/dbname).
- Prisma client not found: run `npx prisma generate`.
- Migrations failing: ensure Postgres is reachable and the user has needed privileges.
- On Windows, inline env var scripts (VAR=val cmd) are POSIX-only; use `$env:VAR='val'; cmd` as shown above or use `cross-env`.

Optional: run everything in Docker (CI/production)

- The docker-compose.yml provides services to run Postgres, a `prisma-migrate` builder and `nextjs-app`. That is suitable for reproducing the full deployment used by the repo (duckdns/certbot/nginx are included and require proper env values).

Commands summary (PowerShell copy-paste)

```powershell
# set up env
Copy-Item -Path .\example.env -Destination .\.env -Force
# edit .env in your editor to set DATABASE_URL etc.

# install deps
npm ci

# generate prisma client
npx prisma generate

# dev migrations + seed (local DB must be up and reachable)
npx prisma migrate dev --name init
npx prisma db seed

# build and start
npm run build
npm run start

# or for dev
npm run dev
```
