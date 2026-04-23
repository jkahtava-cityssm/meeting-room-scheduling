'use server';

import { spawn } from 'node:child_process';

import { getSchedulerStatus } from './checkEntraScheduler';

export async function startGlobalScheduler(schedule: string = '0 3 * * *') {
  // Check if it's already running (Linux/Mac specific check)
  // This prevents starting 10 workers if the button is clicked 10 times
  try {
    const { isRunning } = await getSchedulerStatus();

    if (isRunning) {
      console.log('Scheduler is already running. No action taken.');
      return {
        success: false,
        message: 'Scheduler is already running in the background.',
      };
    }

    const fullCommand = `npx tsx jobs/scheduler.ts "${schedule}"`;

    // Launch the worker and "detach" it so it survives if the web server restarts
    const child = spawn(fullCommand, {
      detached: true,
      stdio: 'ignore',
      shell: false,
      windowsHide: true,
    });

    child.unref(); // This tells Node not to wait for the child process to exit

    return { success: true, message: `Worker started with schedule: ${schedule}` };
  } catch (err) {
    return { success: false, error: 'Failed to launch worker.' };
  }
}
