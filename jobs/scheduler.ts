import { loadEnvConfig } from '@next/env';
import cron from 'node-cron';
import { prisma } from '@/prisma';
import { syncEntraUsers } from './syncEntraUsers';
import { sendTestEmail } from './testEmail';

// Load Environment Variables
loadEnvConfig(process.cwd());

let runCount = 0;

const task = cron.schedule('* * * * * *', async () => {
  console.log(`\n--- [Run #${runCount}] Cron Triggered at ${new Date().toLocaleTimeString()} ---`);
  runCount++;
  try {
    if (runCount === 1) {
      console.log('Testing Database connection...');
      await prisma.configuration.findFirst();
      console.log('DB Check Successful.');

      console.log(' Waiting 10 seconds...');
      await new Promise((resolve) => setTimeout(resolve, 10000));

      console.log('Task sequence finished.');

      console.log('\nStopping scheduler and exiting test...');

      await syncEntraUsers();

      //await sendTestEmail('j.kahtava@cityssm.on.ca', 'j.kahtava@cityssm.on.ca');

      //Kill the scheduler, since we are testing it
      task.stop();
      await prisma.$disconnect();
      process.exit(0);
    }
  } catch (error) {
    console.error('Cron Task Error:', error);
    process.exit(1);
  }
});

// Start the scheduler
task.start();
