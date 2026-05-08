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

const VALID_COMMANDS = ['dev', 'deploy', 'reset', 'status'];
const prismaCmd = process.argv[2];

if (!prismaCmd || !VALID_COMMANDS.includes(prismaCmd)) {
  console.error(`Error: Please specify a valid prisma command (${VALID_COMMANDS.join(', ')})`);
  process.exit(1);
}

const prismaDir = path.join(process.cwd(), 'prisma');
const targetMigrationsDir = path.join(prismaDir, 'migrations');
const sourceFolderName = provider === 'postgresql' ? 'migrations-postgresql' : 'migrations-sqlserver';
const sourceMigrationsDir = path.join(prismaDir, sourceFolderName);
const additionalArgs = process.argv.slice(3).join(' ');

function linkMigrationFolders() {
  // 1. Create source folder if it doesn't exist yet
  if (!fs.existsSync(sourceMigrationsDir)) {
    fs.mkdirSync(sourceMigrationsDir, { recursive: true });
  }

  // Attempt to remove and Junctions or Symbolic Links
  // If a user is switching between database providers the link could exist for the wrong folder.
  try {
    const stats = fs.lstatSync(targetMigrationsDir);
    if (stats.isSymbolicLink()) {
      fs.unlinkSync(targetMigrationsDir);
      console.log(`Unlinked existing symbolic link at ${targetMigrationsDir}`);
    }
  } catch (e) {
    // Directory doesn't exist.
  }

  // Create a junction or Symbolic link to the sqlserver or postgresql migration folder.
  // This ensures migrations generated get stored in the proper location.
  // Prisma thinks the files are located in the migration folder so we can keep them seperate
  try {
    const type = process.platform === 'win32' ? 'junction' : 'dir';
    fs.symlinkSync(sourceMigrationsDir, targetMigrationsDir, type);
    console.log(`Linked ${sourceFolderName} to prisma/migrations`);
  } catch (err) {
    console.error('Failed to link migrations. Make sure you have permissions.');
    process.exit(1);
  }
}

if (!prismaCmd) {
  console.error('Please specify a command (dev or deploy)');
  process.exit(1);
}

// Create Links first, then run Prisma migrate
linkMigrationFolders();

try {
  execSync(`npx prisma migrate ${prismaCmd} ${additionalArgs}`, { stdio: 'inherit' });
} catch (e) {
  process.exit(1);
}
