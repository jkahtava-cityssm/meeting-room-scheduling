'use server';

import { findProcessById, getSystemProcess, resetSystemProcess } from '@/jobs/system-process.util';

export async function stopGlobalScheduler(systemProcessKey: string) {
  try {
    const processEntry = await getSystemProcess(systemProcessKey);

    const activeProcess = findProcessById(processEntry?.pid || 0, processEntry?.tag || '');

    if (!processEntry || !activeProcess) {
      return { success: true, message: 'Scheduler is not currently running (no metadata found).' };
    }

    if (!activeProcess) {
      console.warn(`[Scheduler] Stored PID ${processEntry?.pid} is invalid or process not found`);

      resetSystemProcess(systemProcessKey);
      return {
        success: true,
        message: 'Stored scheduler process was no longer running. Metadata cleaned up.',
      };
    }

    // Now kill the validated process
    try {
      process.kill(activeProcess.pid, 'SIGTERM');
      console.log(`[Scheduler] Sent SIGTERM to PID ${activeProcess.pid}`);

      // Wait a moment, then force kill if still running
      await new Promise((resolve) => setTimeout(resolve, 2000));

      try {
        process.kill(activeProcess.pid, 'SIGKILL');
        console.log(`[Scheduler] Sent SIGKILL to PID ${activeProcess.pid}`);
      } catch {
        // Process already dead, that's fine
      }
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code !== 'ESRCH') {
        // ESRCH means process not found, which is okay
        console.error('[Scheduler] Error killing process:', err);
      }
    }

    // Clean up metadata file
    resetSystemProcess(systemProcessKey);

    return {
      success: true,
      message: `Scheduler stopped successfully (PID: ${activeProcess.pid}).`,
    };
  } catch (err) {
    console.error('[Scheduler] Stop Error:', err);
    return {
      success: false,
      error: `Failed to stop the scheduler: ${err instanceof Error ? err.message : 'Unknown error'}`,
    };
  }
}
