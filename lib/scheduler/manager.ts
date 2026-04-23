/**
 * Scheduler manager utilities
 * Handles configuration, validation, PID management, and orphan cleanup
 */

import { execSync } from 'node:child_process';
import { existsSync, readFileSync, writeFileSync, unlinkSync } from 'node:fs';
import { join } from 'node:path';
import { randomUUID } from 'node:crypto';
import { createHash } from 'node:crypto';
import { platform } from 'node:os';
import { prisma } from '@/prisma';
import type { SchedulerMetadata, SchedulerStatus } from './types';

// Metadata file location
const METADATA_FILE = join(process.cwd(), '.scheduler-metadata.json');

/**
 * Fetch scheduler cron schedule from database Configuration table
 * Falls back to environment variable if database unavailable
 */
export async function getScheduleFromDB(): Promise<string> {
  const envFallback = process.env.ENTRA_SYNC_SCHEDULE || '0 3 * * *';

  try {
    const config = await prisma.configuration.findUnique({
      where: { key: 'ENTRA_SYNC_SCHEDULE' },
    });

    if (config?.value) {
      return config.value;
    }
  } catch (err) {
    console.warn('[Scheduler] Database unavailable, using fallback schedule:', envFallback);
  }

  return envFallback;
}

/**
 * Validate cron expression format
 * Basic validation using cron-parser or regex
 */
export function validateCronExpression(cron: string): boolean {
  // Basic regex: 5 fields separated by spaces
  const cronRegex =
    /^(\*|(\d+(-\d+)?)(\/\d+)?|\d+(,\d+)*)\s+(\*|(\d+(-\d+)?)(\/\d+)?|\d+(,\d+)*)\s+(\*|(\d+(-\d+)?)(\/\d+)?|\d+(,\d+)*)\s+(\*|(\d+(-\d+)?)(\/\d+)?|\d+(,\d+)*|\?)\s+(\*|(\d+(-\d+)?)(\/\d+)?|\d+(,\d+)*)$/;
  return cronRegex.test(cron.trim());
}

/**
 * Generate unique process marker for this scheduler
 * Format: SCHEDULER_DB_<DATABASE_NAME>_<UUID>
 */
export function generateProcessMarker(): string {
  const dbName = process.env.DATABASE_NAME || 'unknown';
  const uuid = randomUUID();
  return `SCHEDULER_DB_${dbName}_${uuid}`;
}

/**
 * Hash a cron expression for change detection
 */
export function hashSchedule(schedule: string): string {
  return createHash('sha256').update(schedule).digest('hex');
}

/**
 * Save scheduler metadata to file
 */
export function saveSchedulerMetadata(pid: number, schedule: string, marker: string): void {
  const metadata: SchedulerMetadata = {
    pid,
    databaseName: process.env.DATABASE_NAME || 'unknown',
    startTime: Date.now(),
    scheduleHash: hashSchedule(schedule),
    processMarker: marker,
    schedule,
  };

  try {
    writeFileSync(METADATA_FILE, JSON.stringify(metadata, null, 2));
    console.log(`[Scheduler] Metadata saved - PID: ${pid}, Marker: ${marker}`);
  } catch (err) {
    console.error('[Scheduler] Failed to save metadata:', err);
  }
}

/**
 * Load scheduler metadata from file
 */
export function loadSchedulerMetadata(): SchedulerMetadata | null {
  if (!existsSync(METADATA_FILE)) {
    return null;
  }

  try {
    const content = readFileSync(METADATA_FILE, 'utf-8');
    return JSON.parse(content) as SchedulerMetadata;
  } catch (err) {
    console.error('[Scheduler] Failed to load metadata:', err);
    return null;
  }
}

/**
 * Delete metadata file
 */
export function deleteSchedulerMetadata(): void {
  try {
    if (existsSync(METADATA_FILE)) {
      unlinkSync(METADATA_FILE);
      console.log('[Scheduler] Metadata file deleted');
    }
  } catch (err) {
    console.error('[Scheduler] Failed to delete metadata:', err);
  }
}

/**
 * Validate that a stored PID is actually our scheduler
 * Checks: PID exists, process command line contains marker and DATABASE_NAME
 */
export function validatePID(storedPID: number, expectedMarker: string): boolean {
  const isWindows = platform() === 'win32';
  const dbName = process.env.DATABASE_NAME || 'unknown';

  try {
    if (isWindows) {
      // Windows: use tasklist to get running processes
      try {
        const output = execSync(`tasklist /pid ${storedPID} /fo csv`, {
          encoding: 'utf-8',
          timeout: 5000,
        });
        // If tasklist returns output, process exists
        if (!output.includes(storedPID.toString())) {
          return false;
        }
      } catch {
        return false; // Process doesn't exist
      }
    } else {
      // Linux/Mac: check if process exists via /proc
      const cmdlineFile = `/proc/${storedPID}/cmdline`;
      if (!existsSync(cmdlineFile)) {
        return false;
      }

      const cmdline = readFileSync(cmdlineFile, 'utf-8');

      // Verify marker and database name are in the command line
      if (!cmdline.includes(expectedMarker) || !cmdline.includes(dbName)) {
        return false;
      }
    }

    return true;
  } catch (err) {
    return false;
  }
}

/**
 * Find all orphaned scheduler processes for this database
 * Returns PIDs of processes with same DATABASE_NAME tag but potentially different/old markers
 */
export function findOrphanedSchedulers(): number[] {
  const isWindows = platform() === 'win32';
  const dbName = process.env.DATABASE_NAME || 'unknown';
  const marker = `SCHEDULER_DB_${dbName}_`;
  const orphans: number[] = [];

  try {
    if (isWindows) {
      // Windows: use tasklist
      const output = execSync('tasklist /fo csv /nh', {
        encoding: 'utf-8',
        timeout: 5000,
      });

      const lines = output.split('\n');
      for (const line of lines) {
        if (line.includes('tsx') && line.includes('scheduler-wrapper')) {
          // This is likely a scheduler process
          // Try to extract command to check for our marker
          try {
            const pid = parseInt(line.split(',')[1]);
            if (isNaN(pid)) continue;

            const cmdOutput = execSync(`wmic process where ProcessId=${pid} get CommandLine /format:csv`, {
              encoding: 'utf-8',
              timeout: 5000,
            });

            if (cmdOutput.includes(marker)) {
              orphans.push(pid);
            }
          } catch {
            // Skip this process
          }
        }
      }
    } else {
      // Linux/Mac: use pgrep and check /proc
      try {
        const pids = execSync(`pgrep -f "scheduler-wrapper"`, {
          encoding: 'utf-8',
          timeout: 5000,
        })
          .trim()
          .split('\n');

        for (const pidStr of pids) {
          const pid = parseInt(pidStr);
          if (isNaN(pid)) continue;

          try {
            const cmdline = readFileSync(`/proc/${pid}/cmdline`, 'utf-8');
            if (cmdline.includes(marker)) {
              orphans.push(pid);
            }
          } catch {
            // Process might have exited, skip
          }
        }
      } catch {
        // pgrep found nothing
      }
    }
  } catch (err) {
    console.error('[Scheduler] Error finding orphaned schedulers:', err);
  }

  return orphans;
}

/**
 * Kill orphaned schedulers for this database
 * Gracefully terminates with SIGTERM, then SIGKILL if needed
 */
export function killOrphanedSchedulers(): void {
  const orphans = findOrphanedSchedulers();
  const dbName = process.env.DATABASE_NAME || 'unknown';

  if (orphans.length === 0) {
    console.log('[Scheduler] No orphaned schedulers found');
    return;
  }

  console.log(`[Scheduler] Found ${orphans.length} orphaned scheduler(s) for database: ${dbName}`);

  for (const pid of orphans) {
    try {
      process.kill(pid, 'SIGTERM');
      console.log(`[Scheduler] Killed orphaned process (SIGTERM): PID ${pid}`);

      // Wait a bit, then force kill if still running
      setTimeout(() => {
        try {
          process.kill(pid, 'SIGKILL');
          console.log(`[Scheduler] Force killed orphaned process (SIGKILL): PID ${pid}`);
        } catch {
          // Already dead
        }
      }, 2000);
    } catch (err) {
      console.warn(`[Scheduler] Failed to kill orphaned process ${pid}:`, err);
    }
  }
}

/**
 * Check if a scheduler is currently running
 */
export function isSchedulerRunning(): boolean {
  const metadata = loadSchedulerMetadata();
  if (!metadata) {
    return false;
  }

  return validatePID(metadata.pid, metadata.processMarker);
}

/**
 * Get current scheduler status
 */
export function getSchedulerStatus(): SchedulerStatus {
  const metadata = loadSchedulerMetadata();

  if (!metadata) {
    return { isRunning: false };
  }

  const isRunning = validatePID(metadata.pid, metadata.processMarker);

  if (!isRunning) {
    return { isRunning: false };
  }

  return {
    isRunning: true,
    pid: metadata.pid,
    schedule: metadata.schedule,
    processMarker: metadata.processMarker,
    startTime: metadata.startTime,
  };
}

/**
 * Initialize scheduler on app startup
 * Validates stored PID, cleans up orphans, and logs status
 */
export async function initializeSchedulerOnAppStart(): Promise<void> {
  console.log('[Scheduler] Initializing on app startup...');

  const metadata = loadSchedulerMetadata();

  if (!metadata) {
    console.log('[Scheduler] No stored metadata found');
    killOrphanedSchedulers(); // Clean up any stray processes
    return;
  }

  const isValid = validatePID(metadata.pid, metadata.processMarker);

  if (isValid) {
    console.log(`[Scheduler] Scheduler is running - PID: ${metadata.pid}, Marker: ${metadata.processMarker}`);
    return;
  }

  console.log('[Scheduler] Stored PID is invalid or process has died');
  deleteSchedulerMetadata();
  killOrphanedSchedulers(); // Clean up any orphaned processes
  console.log('[Scheduler] Cleanup complete');
}

/**
 * Update schedule in database and trigger restart
 * This is called from the API endpoint
 */
export async function updateScheduleInDB(newSchedule: string): Promise<void> {
  if (!validateCronExpression(newSchedule)) {
    throw new Error(`Invalid cron expression: ${newSchedule}`);
  }

  await prisma.configuration.update({
    where: { key: 'ENTRA_SYNC_SCHEDULE' },
    data: { value: newSchedule },
  });

  console.log(`[Scheduler] Schedule updated in database: ${newSchedule}`);
}
