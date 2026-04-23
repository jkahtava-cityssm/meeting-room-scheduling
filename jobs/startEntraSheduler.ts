'use server';

import { spawn } from 'node:child_process';
import {
  getScheduleFromDB,
  validateCronExpression,
  generateProcessMarker,
  saveSchedulerMetadata,
  isSchedulerRunning,
  killOrphanedSchedulers,
  getSchedulerStatus as getSchedulerStatusFromManager,
} from '@/lib/scheduler/manager';

export async function startGlobalScheduler(schedule?: string) {
  try {
    // Check if scheduler is already running with valid PID/marker
    if (isSchedulerRunning()) {
      console.log('[Scheduler] Scheduler is already running. No action taken.');
      const status = getSchedulerStatusFromManager();
      return {
        success: false,
        message: 'Scheduler is already running in the background.',
        currentPid: status.pid,
        currentSchedule: status.schedule,
      };
    }

    // Clean up any orphaned schedulers first
    killOrphanedSchedulers();

    // Use provided schedule or fetch from DB
    const finalSchedule = schedule || (await getScheduleFromDB());

    // Validate cron expression
    if (!validateCronExpression(finalSchedule)) {
      return {
        success: false,
        error: `Invalid cron expression: ${finalSchedule}`,
      };
    }

    // Generate unique marker for this process
    const marker = generateProcessMarker();

    console.log(`[Scheduler] Starting scheduler with marker: ${marker}`);
    console.log(`[Scheduler] Schedule: ${finalSchedule}`);

    // Build command to spawn scheduler-wrapper
    const command = `npx`;
    const args = ['tsx', 'jobs/scheduler-wrapper.ts', '--schedule', finalSchedule, '--marker', marker];

    // Launch the worker as detached process so it survives web server restart
    const child = spawn(command, args, {
      detached: true,
      stdio: 'ignore',
      shell: false,
      windowsHide: true,
    });

    const pid = child.pid;
    if (!pid) {
      return {
        success: false,
        error: 'Failed to spawn scheduler process - no PID returned',
      };
    }

    child.unref(); // Tell Node not to wait for child process to exit

    // Save metadata with the new PID and marker
    saveSchedulerMetadata(pid, finalSchedule, marker);

    return {
      success: true,
      message: `Scheduler started with schedule: ${finalSchedule}`,
      pid,
      marker,
      schedule: finalSchedule,
    };
  } catch (err) {
    console.error('[Scheduler] Error starting scheduler:', err);
    return {
      success: false,
      error: `Failed to launch scheduler: ${err instanceof Error ? err.message : 'Unknown error'}`,
    };
  }
}
