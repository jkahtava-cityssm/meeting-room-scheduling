'use server';
import { EntraSyncSchema } from '../schema';
import { getSystemProcess, saveSystemProcess, updateSystemProcess } from '../system-process.data';
import { findProcessById, startBackgroundProcess, stopBackgroundProcess } from '../system-process.util';
import { getNextCronOccurrence } from '../cron-util';

const SYSTEM_PROCESS_KEY = 'ENTRA_SYNC_SCHEDULER';

export async function createEntraSyncSchedulerProcessEntry() {
  const processTag = `${SYSTEM_PROCESS_KEY}_${process.env.DATABASE_NAME ? process.env.DATABASE_NAME : 'unknown'}`.toUpperCase();
  return await saveSystemProcess({
    processKey: SYSTEM_PROCESS_KEY,
    pid: 0,
    parameter: '{"schedule": "0 3 * * *"}',
    processTag: processTag,
  });
}

export async function startEntraSyncScheduler() {
  return await startBackgroundProcess({
    systemProcessKey: SYSTEM_PROCESS_KEY,
    scriptPath: ['jobs', 'entra-sync', 'entra-sync-process.js'],
    schema: EntraSyncSchema,
  });
}

export async function stopEntraSyncScheduler() {
  return await stopBackgroundProcess(SYSTEM_PROCESS_KEY);
}

export async function updateEntraSyncSchedule(newSchedule: string, sessionUserId: number) {
  await updateSystemProcess({ processKey: SYSTEM_PROCESS_KEY, parameter: `{ "schedule": "${newSchedule}" }`, userId: sessionUserId });
}

export async function pollEntraSyncScheduler(): Promise<{
  schedule: string | null;
  isRunning: boolean;
  pid: number | null;
  marker: string | null;
  startTime: Date | null;
  nextRuntime: string | null;
} | null> {
  const processEntry = await getSystemProcess(SYSTEM_PROCESS_KEY, EntraSyncSchema);

  if (!processEntry) {
    return null;
  }

  const activeProcess = await findProcessById(processEntry.pid, processEntry.tag);

  return {
    schedule: processEntry.parameter.schedule,
    isRunning: activeProcess?.pid ? true : false,
    pid: processEntry.pid,
    marker: processEntry.tag,
    startTime: processEntry.updatedAt,
    nextRuntime: getNextCronOccurrence(processEntry.parameter.schedule),
  };
}
