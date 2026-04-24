'use server';

import { spawn } from 'node:child_process';
import { findProcessById, startBackgroundProcess, stopOrphanedProcesses } from '@/jobs/system-process.util';
import path from 'path';
import { validateCronExpression } from './scheduler-util';
import { getSystemProcess, saveSystemProcess } from '../system-process.data';

export async function startGlobalScheduler(schedule?: string) {
  const systemProcessKey = 'ENTRA_SYNC_SCHEDULER';
  const processEntry = await getSystemProcess(systemProcessKey);

  const processSchedule = processEntry?.parameter || '0 3 * * *';

  await startBackgroundProcess({
    systemProcessKey: systemProcessKey,
    scriptPath: ['dist', 'scheduler-wrapper.js'],
    args: ['--schedule', processSchedule],
    defaultParameter: 'standard-sync',
  });

  try {
    const ENTRA_SYNC_TAG = `${systemProcessKey}_${process.env.DATABASE_NAME ? process.env.DATABASE_NAME : 'unknown'}`.toUpperCase();

    const processEntry = await getSystemProcess(systemProcessKey);

    const activeProcess = findProcessById(processEntry?.pid || 0, processEntry?.tag || '');

    if (activeProcess && processEntry) {
      console.log('[Scheduler] Scheduler is already running. No action taken.');

      return {
        success: false,
        message: 'Scheduler is already running in the background.',
        currentPid: activeProcess.pid,
        currentSchedule: processEntry.parameter,
      };
    }

    // Clean up any orphaned schedulers first
    await stopOrphanedProcesses(ENTRA_SYNC_TAG, processEntry?.pid || 0);

    // Use provided schedule or fetch from DB
    const finalSchedule = processEntry?.parameter || '0 3 * * *'; // default to 3 AM daily if not set

    // Validate cron expression
    if (!validateCronExpression(finalSchedule)) {
      return {
        success: false,
        error: `Invalid cron expression: ${finalSchedule}`,
      };
    }

    console.log(`[Scheduler] Starting scheduler with tag: ${ENTRA_SYNC_TAG}`);
    console.log(`[Scheduler] Schedule: ${finalSchedule}`);

    const parts = ['dist', 'scheduler-wrapper.js'];
    const scriptPath = path.join(process.cwd(), ...parts);

    console.log(`[Scheduler] Script path: ${scriptPath}`);

    // Build command to spawn scheduler-wrapper
    const command = `node`;
    const args = [scriptPath, '--schedule', finalSchedule, '--marker', ENTRA_SYNC_TAG];

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
    await saveSystemProcess(pid, finalSchedule, ENTRA_SYNC_TAG, systemProcessKey);

    return {
      success: true,
      message: `Scheduler started with schedule: ${finalSchedule}`,
      pid,
      marker: ENTRA_SYNC_TAG,
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

// Example: Starting a generic sync worker
