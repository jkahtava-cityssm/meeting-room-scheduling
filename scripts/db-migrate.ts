import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import { loadEnvConfig } from '@next/env';

loadEnvConfig(process.cwd());

const VALID_PROVIDERS = ['postgresql', 'sqlserver'];
const provider = process.env.DATABASE_PROVIDER;

if (!provider || !VALID_PROVIDERS.includes(provider)) {
  console.error(`Error: DATABASE_PROVIDER must be one of: ${VALID_PROVIDERS.join(', ')}`);
  console.error(`Current value: "${provider}"`);
  process.exit(1);
}

const VALID_COMMANDS = ['dev', 'deploy', 'reset', 'status', 'link'];
const prismaCmd = process.argv[2];

if (!prismaCmd || !VALID_COMMANDS.includes(prismaCmd)) {
  console.error(`Error: Please specify a valid command (${VALID_COMMANDS.join(', ')})`);
  process.exit(1);
}

const prismaDir = path.join(process.cwd(), 'prisma');
const targetMigrationsDir = path.join(prismaDir, 'migrations');
const sourceFolderName = provider === 'postgresql' ? 'migrations-postgresql' : 'migrations-sqlserver';
const sourceMigrationsDir = path.join(prismaDir, sourceFolderName);
const additionalArgs = process.argv.slice(3).join(' ');

function linkMigrationFolders() {
  if (!fs.existsSync(sourceMigrationsDir)) {
    fs.mkdirSync(sourceMigrationsDir, { recursive: true });
  }

  try {
    const stats = fs.lstatSync(targetMigrationsDir);

    if (stats.isSymbolicLink() || stats.isDirectory()) {
      fs.rmSync(targetMigrationsDir, { recursive: true, force: true });
      console.log(`Removed existing target at ${targetMigrationsDir}`);
    }
  } catch (e) {
    // Directory doesn't exist, safe to proceed
  }

  try {
    const type = process.platform === 'win32' ? 'junction' : 'dir';
    fs.symlinkSync(sourceMigrationsDir, targetMigrationsDir, type);
    console.log(`Linked ${sourceFolderName} to prisma/migrations`);
  } catch (err) {
    console.error('Failed to link migrations. Make sure you have administrator/elevated permissions.');
    process.exit(1);
  }
}

// 1. Link the folders first
linkMigrationFolders();

// 2. If the user only requested a link, exit now before migrating
if (prismaCmd === 'link') {
  console.log('Folders linked successfully! Exiting without running migrations.');
  process.exit(0);
}

// 3. Otherwise, run the requested Prisma command
try {
  execSync(`npx prisma migrate ${prismaCmd} ${additionalArgs}`, { stdio: 'inherit' });
} catch (e) {
  process.exit(1);
}
