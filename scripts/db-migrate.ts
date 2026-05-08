import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import { loadEnvConfig } from '@next/env';

loadEnvConfig(process.cwd());

const provider = process.env.DATABASE_PROVIDER || 'sqlserver';
const prismaDir = path.join(process.cwd(), 'prisma');
const targetMigrationsDir = path.join(prismaDir, 'migrations');

// Map providers to your separate source folders
const sourceFolderName = provider === 'postgresql' ? 'migrations-postgresql' : 'migrations-sqlserver';
const sourceMigrationsDir = path.join(prismaDir, sourceFolderName);

const prismaCmd = process.argv[2];
const additionalArgs = process.argv.slice(3).join(' ');

function syncMigrations() {
  // 1. Create source folder if it doesn't exist yet
  if (!fs.existsSync(sourceMigrationsDir)) {
    fs.mkdirSync(sourceMigrationsDir, { recursive: true });
  }

  // 2. Clear out the 'active' migrations folder to prevent cross-provider pollution
  if (fs.existsSync(targetMigrationsDir)) {
    // We use a safe delete to handle symlinks or directories
    fs.rmSync(targetMigrationsDir, { recursive: true, force: true });
  }

  // 3. Sync the files.
  // On dev machines, a Symbolic Link (junction on Windows) is best so
  // changes made by Prisma are saved directly back to your source folder.
  try {
    const type = process.platform === 'win32' ? 'junction' : 'dir';
    fs.symlinkSync(sourceMigrationsDir, targetMigrationsDir, type);
    console.log(`🔗 Linked ${sourceFolderName} to prisma/migrations`);
  } catch (err) {
    console.error('Failed to link migrations. Make sure you have permissions.');
    process.exit(1);
  }
}

if (!prismaCmd) {
  console.error('Please specify a command (dev or deploy)');
  process.exit(1);
}

// Sync first, then run Prisma
syncMigrations();

try {
  execSync(`npx prisma migrate ${prismaCmd} ${additionalArgs}`, { stdio: 'inherit' });
} catch (e) {
  process.exit(1);
}
