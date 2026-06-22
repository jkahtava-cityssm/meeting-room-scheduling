/**
 * Entra Sync Worker Process
 * Managed by Orchestrator
 */
import { loadEnvConfig } from '@next/env';
import cron from 'node-cron';
import { parseArgs } from 'node:util';

// Data access for cleanup
import { resetSystemProcess } from '../system-process.data';

import { processNextEmailJob } from './email-queue-send';
import { SYSTEM_PROCESS_MANIFEST } from '@/lib/types';

// 1. Environment & Config Setup
loadEnvConfig(process.cwd());
const PROCESS_KEY = SYSTEM_PROCESS_MANIFEST['EMAIL_QUEUE_WORKER'].key;

const { values } = parseArgs({
  options: {
    schedule: { type: 'string' },
    marker: { type: 'string' },
  },
  strict: false,
});

const schedule: string = typeof values.schedule === 'string' ? values.schedule : '*/30 * * * * *';

const marker = values.marker || `SERVICE_${process.pid}`;

console.log(`[${marker}] Initialized with PID: ${process.pid} | Schedule: ${schedule}`);

const task = cron.schedule(schedule, async () => {
  const now = new Date().toLocaleTimeString();
  console.log(`[${now}] ${marker}: Starting Email Queue...`);

  try {
    await processNextEmailJob();
  } catch (error) {
    console.error(`[${now}] ${marker}: Email Queue Failed:`, error);
  }
});

// 3. Graceful Shutdown & Cleanup logic
const shutdown = async (signal: string) => {
  console.log(`[${marker}] Received ${signal}. Cleaning up...`);

  try {
    task.stop();
    // Inform the DB that this process is no longer active
    await resetSystemProcess(PROCESS_KEY);
    console.log(`[${marker}] DB status reset successfully.`);
  } catch (err) {
    console.error(`[${marker}] Failed to reset DB status:`, err);
  } finally {
    process.exit(0);
  }
};

// Signal listeners
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

// Error handling
process.on('uncaughtException', (err) => {
  console.error(`[${marker}] Uncaught Exception:`, err);
  shutdown('CRASH');
});

process.on('unhandledRejection', (reason) => {
  console.error(`[${marker}] Unhandled Rejection:`, reason);
});
