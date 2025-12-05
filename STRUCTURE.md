Project Structure Guide
This document explains the folder organization for the Next.js application and provides a migration checklist for moving from the old structure to the new one.

Proposed Structure

```plaintext
|-- src
    |-- app
        |-- (private)
        |-- api
    |-- features
        |-- calendar
        |-- bookings
        |-- settings
    |-- shared
        |-- components
        |-- hooks
        |-- contexts
        |-- lib
        |-- services
    |-- public
    |-- styles
    |-- types
|-- container
|-- prisma.ts
|-- .env
|-- next.config.ts
|-- tsconfig.json
|-- README.md



Folder Details

app/: Next.js App Router pages and API routes.
features/: Feature-first organization for domain-specific logic.
shared/: Reusable UI components, hooks, contexts, and utilities.
public/: Static assets.
styles/: Global CSS and theme files.
types/: Centralized TypeScript types.
container/: Docker, Nginx, Certbot configs.


Migration Checklist
Step 1: Create src Directory

Move all application code into src/.
Keep infrastructure files (Docker, Nginx, etc.) in root or container/.


Step 2: Restructure app

Keep Next.js routes in src/app.
Flatten API routes:

Move route.ts files up one level where possible.
Rename nested API folders like status/route.ts → status.ts.




Step 3: Create features Folder

For each domain (e.g., calendar, bookings, settings):

Move related components from components/calendar → features/calendar/components.
Move related hooks from hooks → features/calendar/hooks.
Move context providers from contexts → features/calendar/context.
Move web workers from components/calendar/webworkers → features/calendar/workers.




Step 4: Organize Shared Code

Move generic UI components to shared/components/ui.

Group skeletons under shared/components/ui/skeletons.


Move navigation components to shared/components/nav.
Move global hooks to shared/hooks.
Move global contexts to shared/contexts.
Move utilities and schemas to shared/lib.
Move API service files to shared/services.


Step 5: Clean Up

Remove deprecated files (e.g., page-deprecated.tsx).
Rename files with spaces or “copy” suffix (e.g., calendar-public-view copy.tsx → calendar-public-view.tsx).
Ensure consistent naming: PascalCase for components, kebab-case for folders.


Step 6: Update Imports

Use absolute imports with baseUrl set to src in tsconfig.json.
Update all import paths to reflect new structure.

```
