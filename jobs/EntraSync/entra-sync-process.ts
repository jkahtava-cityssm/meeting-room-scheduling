/**
 * Scheduler wrapper - entry point for the scheduler process
 * Spawned as a detached child process
 *
 * Usage:
 *   tsx jobs/entra-sync-process.ts --schedule "0 3 * * *" --marker "SCHEDULER_DB_meeting_room_scheduling_abc123"
 */

import { loadEnvConfig } from '@next/env';
import cron from 'node-cron';
import { parseArgs } from 'node:util';

// Load environment variables
loadEnvConfig(process.cwd());

// Parse command line arguments
const { values } = parseArgs({
  options: {
    schedule: { type: 'string' },
    marker: { type: 'string' },
  },
});

const schedule = values.schedule || process.env.ENTRA_SYNC_SCHEDULE || '0 3 * * *';
const marker = values.marker || `SCHEDULER_${process.pid}`;

// Store marker in environment for process inspection
//process.env.SCHEDULER_PROCESS_MARKER = marker;

console.log(`[${new Date().toISOString()}] Scheduler initialized: ${marker}`);
console.log(`[${new Date().toISOString()}] Schedule: ${schedule}`);
console.log(`[${new Date().toISOString()}] PID: ${process.pid}`);

// Import sync function
import { syncEntraUsers } from './syncEntraUsers';

// Schedule the recurring task
try {
  cron.schedule(schedule, async () => {
    console.log(`[${new Date().toLocaleTimeString()}] Sync Starting`);

    try {
      await syncEntraUsers();
      console.log(`[${new Date().toLocaleTimeString()}] Sync Completed`);
    } catch (error) {
      console.error('[Scheduler] Sync Error:', error);
    }
  });

  console.log(`[${new Date().toLocaleTimeString()}] Worker is resident. Monitoring for schedule: ${schedule}...`);
} catch (error) {
  console.error('[Scheduler] Failed to schedule task:', error);
  process.exit(1);
}

// Graceful shutdown on SIGTERM
process.on('SIGTERM', () => {
  console.log(`[${new Date().toLocaleTimeString()}] SIGTERM received, shutting down gracefully...`);
  process.exit(0);
});

// Graceful shutdown on SIGINT
process.on('SIGINT', () => {
  console.log(`[${new Date().toLocaleTimeString()}] SIGINT received, shutting down gracefully...`);
  process.exit(0);
});

// Log any uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('[Scheduler] Uncaught Exception:', err);
  process.exit(1);
});

// Log unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('[Scheduler] Unhandled Rejection:', reason);
});
