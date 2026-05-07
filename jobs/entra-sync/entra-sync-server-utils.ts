'use server';
import { EntraSyncSchema } from '../schema';
import { getSystemProcess, saveSystemProcess, updateSystemProcess } from '../system-process.data';
import { findProcessById, startBackgroundProcess, stopBackgroundProcess } from '../system-process.util';
import { getNextCronOccurrence } from '../cron-util';
import { SYSTEM_PROCESS_MANIFEST } from '@/lib/types';

const SYSTEM_PROCESS_KEY = SYSTEM_PROCESS_MANIFEST['ENTRA_SYNC_SCHEDULER'].key;
const SYSTEM_PROCESS_DEFAULT_PARAMETER = SYSTEM_PROCESS_MANIFEST['ENTRA_SYNC_SCHEDULER'].defaultParameter;

export async function startEntraSyncScheduler() {
  return await startBackgroundProcess({
    systemProcessKey: SYSTEM_PROCESS_KEY,
    scriptPath: ['entra-sync', 'entra-sync-process.js'],
    schema: EntraSyncSchema,
  });
}

export async function stopEntraSyncScheduler() {
  return await stopBackgroundProcess(SYSTEM_PROCESS_KEY);
}

export async function updateEntraSyncSchedule(newSchedule: string, sessionUserId: number) {
  const currentParams = JSON.parse(SYSTEM_PROCESS_DEFAULT_PARAMETER);

  const updatedParams = {
    ...currentParams,
    schedule: newSchedule,
  };

  await updateSystemProcess({ processKey: SYSTEM_PROCESS_KEY, parameter: JSON.stringify(updatedParams), userId: sessionUserId });
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
