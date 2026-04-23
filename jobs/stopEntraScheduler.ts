'use server';

import { exec } from 'node:child_process';
import { promisify } from 'node:util';
import { platform } from 'node:os';
import { getSchedulerStatus } from './checkEntraScheduler';

const execPromise = promisify(exec);

export async function stopGlobalScheduler() {
  const isWindows = platform() === 'win32';

  try {
    // 1. Check if it's even running first
    const { isRunning } = await getSchedulerStatus();
    if (!isRunning) {
      return { success: true, message: 'Scheduler is not currently running.' };
    }

    // 2. Run the platform-specific kill command
    if (isWindows) {
      /**
       * Windows: taskkill
       * /FI filters by window title (which tsx sets)
       * /F forces the termination
       */
      await execPromise('taskkill /FI "windowtitle eq tsx jobs/scheduler.ts*" /F');
    } else {
      /**
       * Unix: pkill
       * -f matches against the full command line
       */
      await execPromise('pkill -f "tsx jobs/scheduler.ts"');
    }

    return { success: true, message: 'Scheduler stopped successfully.' };
  } catch (err) {
    console.error('Stop Error:', err);
    return { success: false, error: 'Failed to stop the scheduler process.' };
  }
}
