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

export async function getSystemProcess(processKey: string) {
  try {
    const systemProcess = await prisma.systemProcess.findFirst({
      select: { pid: true, tag: true, parameter: true, updatedAt: true },
      where: { key: processKey },
    });

    console.log(`[Scheduler] Metadata saved - PID: ${systemProcess?.pid}, Marker: ${systemProcess?.tag}`);

    return systemProcess;
  } catch (err) {
    console.error('[Scheduler] Failed to save metadata:', err);
  }
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
 * Save scheduler metadata to file
 */
export async function saveSystemProcess(pid: number, schedule: string, processTag: string, processKey: string, userId: number = 0) {
  try {
    const process = await prisma.systemProcess.upsert({
      create: { pid, key: processKey, tag: processTag, parameter: schedule, createdBy: userId, updatedBy: userId },
      update: { pid, parameter: schedule, updatedBy: userId },
      where: { key: processKey },
    });

    console.log(`[Scheduler] Metadata saved - PID: ${pid}, Marker: ${processTag}`);
  } catch (err) {
    console.error('[Scheduler] Failed to save metadata:', err);
  }
}

export function updateSystemProcess(processKey: string, pid?: number, schedule?: string, processTag?: string, userId: number = 0): void {
  try {
    prisma.systemProcess.update({
      data: { pid, key: processKey, tag: processTag, parameter: schedule, createdBy: userId, updatedBy: userId },
      where: { key: processKey },
    });

    console.log(`[Scheduler] Metadata saved - PID: ${pid}, Marker: ${processTag}`);
  } catch (err) {
    console.error('[Scheduler] Failed to save metadata:', err);
  }
}

/**
 * Delete metadata file
 */
export async function resetSystemProcess(processKey: string) {
  try {
    await prisma.systemProcess.update({
      data: { requiresRestart: true, pid: 0, updatedBy: 0 },
      where: { key: processKey },
    });

    console.log('[Scheduler] System Process reset');
  } catch (err) {
    console.error('[Scheduler] Failed to reset System Process:', err);
  }
}

/**
 * Validate that a stored PID is actually our scheduler
 * Checks: PID exists, process command line contains marker and DATABASE_NAME
 */
export function findProcessById(storedPID: number, processTag: string) {
  const isWindows = platform() === 'win32';

  try {
    if (isWindows) {
      // Windows: use tasklist to get running processes

      const psScript = `
                  Get-CimInstance Win32_Process -Filter "ProcessId = ${storedPID}" |
                  ForEach-Object {
                      $cmdLine = $_.CommandLine;
                      $match = [regex]::Match($cmdLine, '--marker\\s+([^\\s]+)');
                      
                      [PSCustomObject]@{
                          pid    = $_.ProcessId;
                          marker = if ($match.Success) { $match.Groups[1].Value } else { "Unknown" };
                      }
                  } | ConvertTo-Json -Compress
              `
        .trim()
        .replace(/\n/g, ' ')
        .replace(/\s+/g, ' ')
        .replace(/"/g, '\\"');

      const cmd = `powershell -NoProfile -ExecutionPolicy Bypass -Command "${psScript}"`;
      const stdout = execSync(cmd, { encoding: 'utf-8' }).trim();

      if (!stdout) return null;

      const data = JSON.parse(stdout);
      // Ensure it contains our marker or db name to be considered "found"
      if (data.marker && data.marker.toLowerCase() === processTag.toLowerCase()) {
        return { pid: data.pid, marker: data.marker };
      }
      return null;
    } else {
      const cmd = `ps -p ${storedPID} -o command=`;
      const stdout = execSync(cmd, { encoding: 'utf-8', stdio: ['pipe', 'pipe', 'ignore'] }).trim();

      if (!stdout) return null;

      if (stdout.includes(processTag)) {
        const match = stdout.match(/--marker\s+([^\s]+)/);
        const extractedMarker = match ? match[1] : 'Unknown';

        return {
          pid: storedPID,
          marker: extractedMarker,
        };
      }
    }
  } catch (err) {
    return null;
  }
}

/**
 * Find all orphaned scheduler processes for this database
 * Returns PIDs of processes with same DATABASE_NAME tag but potentially different/old markers
 */

interface ProcessInfo {
  pid: number;
  marker: string;
}

export function findProcessByTag(processTag: string, activeProcessID: number): number[] {
  const isWindows = platform() === 'win32';

  const orphans: number[] = [];

  try {
    if (isWindows) {
      try {
        const psScript = `
                  Get-CimInstance Win32_Process -Filter "CommandLine LIKE '%--marker ${processTag}%' AND NOT CommandLine LIKE '%Get-CimInstance%'" | 
                  ForEach-Object {
                      $cmdLine = $_.CommandLine;
                      $match = [regex]::Match($cmdLine, '--marker\\s+([^\\s]+)');
                      
                      [PSCustomObject]@{
                          pid    = $_.ProcessId;
                          parent  = $_.ParentProcessId;
                          marker = if ($match.Success) { $match.Groups[1].Value } else { "Unknown" };
                          command = $cmdLine;
                      }
                  } | ConvertTo-Json -Compress
              `
          .trim()
          .replace(/\n/g, ' ')
          .replace(/\s+/g, ' ')
          .replace(/"/g, '\\"');

        const formattedCmd = `powershell -NoProfile -ExecutionPolicy Bypass -Command "${psScript}"`;
        const stdout = execSync(formattedCmd, { encoding: 'utf-8' }).trim();

        if (!stdout || stdout.trim() === '') return [];

        const rawData = JSON.parse(stdout);
        const processObject: ProcessInfo[] = Array.isArray(rawData) ? rawData : [rawData];

        for (const process of processObject) {
          if (process.marker && process.pid !== activeProcessID) {
            orphans.push(process.pid);
          }
        }
      } catch (e) {
        console.warn('[Scheduler] No matching processes found or error occurred:', e);
        return [];
      }
      return orphans;
    } else {
      try {
        // -e: all processes
        // -o pid,args: only output the PID and the full command line
        const output = execSync('ps -e -o pid,args', {
          encoding: 'utf-8',
          timeout: 5000,
        });

        const lines = output.trim().split('\n');

        for (const line of lines) {
          // Split by first whitespace to get PID and everything else as the command
          const match = line.trim().match(/^(\d+)\s+(.+)$/);
          if (!match) continue;

          const pid = parseInt(match[1], 10);
          const fullCommand = match[2];

          // 1. Check if it's our wrapper script
          // 2. Check if it contains our specific marker
          // 3. Ensure it's not THIS current process (if the marker is in our own env)
          if (
            fullCommand.includes('scheduler-wrapper') &&
            fullCommand.includes(processTag) &&
            process.pid !== activeProcessID &&
            pid !== process.pid
          ) {
            orphans.push(pid);
          }
        }
      } catch (e) {
        // ps failed or no processes found
        console.warn('[Scheduler] Linux process lookup failed:', e);
      }
      return orphans;
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
export function killOrphanedSchedulers(processKey: string, activeProcessID: number): void {
  const orphans = findProcessByTag(processKey, activeProcessID);
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

export function getNextCronOccurrence(cron: string): string | null {
  const parts = cron.split(/\s+/);
  if (parts.length < 4) return null;

  const [mStr, hStr, dStr, moStr] = parts;

  // Early Validation & Parsing
  const parsePart = (s: string) => (s === '*' ? null : parseInt(s, 10));

  const targetHour = parsePart(hStr);
  const targetDay = parsePart(dStr);
  const targetMonth = parsePart(moStr);
  const tempMinute = parseInt(mStr, 10);

  if (isNaN(tempMinute)) return null;
  if (targetHour !== null && (targetHour < 0 || targetHour > 23)) return null;
  if (targetDay !== null && (targetDay < 1 || targetDay > 31)) return null;
  if (targetMonth !== null && (targetMonth < 1 || targetMonth > 12)) return null;

  const now = new Date();
  const next = new Date(now.getTime());
  next.setSeconds(0, 0);
  next.setMilliseconds(0);

  // Clamp Minute to intervals
  const intervals = [0, 15, 30, 45];
  let targetMinute: number;

  const clamped = intervals.find((i) => i >= tempMinute);

  if (clamped === undefined) {
    // If input was 46-59, we move to the 00 mark of the NEXT hour
    targetMinute = 0;
    next.setHours(next.getHours() + 1);
  } else {
    targetMinute = clamped;
  }

  // If the clamped target is in the past/current minute of this hour, move to next hour
  if (next.getHours() === now.getHours() && targetMinute <= now.getMinutes()) {
    next.setHours(next.getHours() + 1);
  }

  next.setMinutes(targetMinute);

  // 2. Matching Loop
  let iterations = 0;
  while (iterations < 500) {
    const curMonth = next.getMonth() + 1;
    const curDay = next.getDate();
    const curHour = next.getHours();

    if (targetMonth !== null && targetMonth !== curMonth) {
      next.setMonth(next.getMonth() + 1, 1);
      next.setHours(0, targetMinute, 0, 0);
      iterations++;
      continue;
    }

    if (targetDay !== null && targetDay !== curDay) {
      next.setDate(targetDay);
      if (next.getDate() !== targetDay) {
        next.setMonth(next.getMonth() + 1, 1);
      }
      next.setHours(0, targetMinute, 0, 0);
      iterations++;
      continue;
    }

    if (targetHour !== null && targetHour !== curHour) {
      next.setHours(next.getHours() + 1, targetMinute, 0, 0);
      iterations++;
      continue;
    }

    return next.toISOString();
  }

  return null;
}
