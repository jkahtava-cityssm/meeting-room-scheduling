'use server';

import {
  loadSchedulerMetadata,
  validatePID,
  deleteSchedulerMetadata,
  getSchedulerStatus as getSchedulerStatusFromManager,
} from '@/lib/scheduler/manager';

export async function stopGlobalScheduler() {
  try {
    // Load stored metadata
    const metadata = loadSchedulerMetadata();

    if (!metadata) {
      return { success: true, message: 'Scheduler is not currently running (no metadata found).' };
    }

    // Validate that the stored PID is actually our scheduler
    const isValid = validatePID(metadata.pid, metadata.processMarker);

    if (!isValid) {
      console.warn(`[Scheduler] Stored PID ${metadata.pid} is invalid or process not found`);
      deleteSchedulerMetadata();
      return {
        success: true,
        message: 'Stored scheduler process was no longer running. Metadata cleaned up.',
      };
    }

    // Now kill the validated process
    try {
      process.kill(metadata.pid, 'SIGTERM');
      console.log(`[Scheduler] Sent SIGTERM to PID ${metadata.pid}`);

      // Wait a moment, then force kill if still running
      await new Promise((resolve) => setTimeout(resolve, 2000));

      try {
        process.kill(metadata.pid, 'SIGKILL');
        console.log(`[Scheduler] Sent SIGKILL to PID ${metadata.pid}`);
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
    deleteSchedulerMetadata();

    return {
      success: true,
      message: `Scheduler stopped successfully (PID: ${metadata.pid}).`,
    };
  } catch (err) {
    console.error('[Scheduler] Stop Error:', err);
    return {
      success: false,
      error: `Failed to stop the scheduler: ${err instanceof Error ? err.message : 'Unknown error'}`,
    };
  }
}
