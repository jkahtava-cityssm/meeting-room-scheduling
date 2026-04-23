import { loadEnvConfig } from '@next/env';
import cron from 'node-cron';
import { prisma } from '@/prisma';
import { syncEntraUsers } from './syncEntraUsers';
import { sendTestEmail } from './testEmail';

// Load Environment Variables
loadEnvConfig(process.cwd());

const cronSchedule = process.argv[2] || '0 3 * * *';

console.log(`Worker initialized with schedule: "${cronSchedule}"`);

async function runJob() {
  console.log(`[${new Date().toLocaleTimeString()}] Sync Starting`);

  try {
    await syncEntraUsers();
    console.log(`[${new Date().toLocaleTimeString()}]  Sync Completed`);
  } catch (error) {
    console.error('Sync Error:', error);
  }
}

// Schedule the recurring task
cron.schedule(cronSchedule, async () => {
  await runJob();
});

console.log(`Worker is now resident. Monitoring for schedule: ${cronSchedule}...`);
