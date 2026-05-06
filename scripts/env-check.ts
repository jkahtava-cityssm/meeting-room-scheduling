import { exit } from 'process';
import { loadEnvConfig } from '@next/env';

loadEnvConfig(process.cwd());

const requiredEnv = [
  'NEXT_PUBLIC_BASE_URL',
  'NEXT_PUBLIC_SUBFOLDER_PATH',
  'PRIVATE_INTERNAL_API_KEY',
  'BETTER_AUTH_URL',
  'BETTER_AUTH_SECRET',
  'TRUSTED_ORIGINS',
  'ADMIN_USER_EMAIL',

  'DATABASE_PROVIDER',
  'DATABASE_NAME',
  'DATABASE_HOST',
  'DATABASE_PORT',
  'DATABASE_USER_USERNAME',
  'DATABASE_USER_PASSWORD',

  'AZURE_AD_CLIENT_ID',
  'AZURE_AD_CLIENT_SECRET',
  'AZURE_AD_TENANT_ID',
];

console.log('Validating environment variables...');

const errors = [];

// 1. Check for existence
requiredEnv.forEach((env) => {
  if (!process.env[env]) {
    errors.push(`Missing: ${env}`);
  }
});

// 2. Validate Format
const domain = process.env.NEXT_PUBLIC_BASE_URL || '';
const subfolder = process.env.NEXT_PUBLIC_SUBFOLDER_PATH || '';

if (domain && domain.endsWith('/')) {
  errors.push('NEXT_PUBLIC_BASE_URL should not end with a slash.');
}

if (subfolder && !subfolder.startsWith('/')) {
  errors.push('NEXT_PUBLIC_SUBFOLDER_PATH must start with a forward slash (e.g., /room-booking).');
}

if (subfolder && subfolder.endsWith('/')) {
  errors.push('NEXT_PUBLIC_SUBFOLDER_PATH should not end with a slash.');
}

if (errors.length > 0) {
  console.error('\nEnvironment Validation Failed:');
  errors.forEach((err) => console.error(err));
  exit(1); // Stop the build
}

console.log('Environment is valid.\n');
