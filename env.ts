import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  NEXT_PUBLIC_API_URL: z.string().url(),
  // Add other variables here
});

// Validate process.env
const _env = envSchema.safeParse({
  NODE_ENV: process.env.NODE_ENV,
  NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
});

if (!_env.success) {
  console.error('Invalid environment variables:');
  // Format Zod errors into a readable table in the terminal
  console.table(_env.error.flatten().fieldErrors);

  // This is the "Kill Switch" for 'next build'
  throw new Error('Invalid environment variables. Fix the issues above to continue.');
}

export const env = _env.data;
