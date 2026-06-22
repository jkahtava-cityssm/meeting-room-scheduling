import 'server-only';

import { EmailQueueSchema } from '../schema';
import { getSystemProcess, updateSystemProcess } from '../system-process.data';
import { findProcessById, startBackgroundProcess, stopBackgroundProcess } from '../system-process.util';
import { getNextCronOccurrence } from '../cron-util';
import { SYSTEM_PROCESS_MANIFEST } from '@/lib/types';

import { prisma } from '@/prisma';

const SYSTEM_PROCESS_KEY = SYSTEM_PROCESS_MANIFEST['EMAIL_QUEUE_WORKER'].key;
const SYSTEM_PROCESS_DEFAULT_PARAMETER = SYSTEM_PROCESS_MANIFEST['EMAIL_QUEUE_WORKER'].defaultParameter;

export async function startEmailQueueWorker() {
  await clearOrphanedJobs();

  return await startBackgroundProcess({
    systemProcessKey: SYSTEM_PROCESS_KEY,
    scriptPath: ['email-queue', 'email-queue-process.js'],
    schema: EmailQueueSchema,
  });
}

export async function stopEmailQueueWorker() {
  return await stopBackgroundProcess(SYSTEM_PROCESS_KEY);
}

export async function updateEmailQueueWorker(newSchedule: string, sessionUserId: number) {
  const currentParams = JSON.parse(SYSTEM_PROCESS_DEFAULT_PARAMETER);

  const updatedParams = {
    ...currentParams,
    schedule: newSchedule,
  };

  await updateSystemProcess({ processKey: SYSTEM_PROCESS_KEY, parameter: JSON.stringify(updatedParams), userId: sessionUserId });
}

export async function pollEmailQueueWorker(): Promise<{
  schedule: string | null;
  isRunning: boolean;
  pid: number | null;
  marker: string | null;
  startTime: Date | null;
  nextRuntime: string | null;
} | null> {
  const processEntry = await getSystemProcess(SYSTEM_PROCESS_KEY, EmailQueueSchema);

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

export async function clearOrphanedJobs(): Promise<{ jobsReverted: number; workerRunning: boolean }> {
  const workerStatus = await pollEmailQueueWorker();

  if (workerStatus && workerStatus.isRunning) {
    return { jobsReverted: 0, workerRunning: true };
  }

  const processingJobs = await prisma.emailQueue.findMany({
    where: {
      status: {
        startsWith: 'PROCESSING_',
      },
    },
    select: { emailQueueId: true },
  });

  if (processingJobs.length === 0) {
    return { jobsReverted: 0, workerRunning: false };
  }

  const idsToRevert = processingJobs.map((job) => job.emailQueueId);

  const updateResult = await prisma.emailQueue.updateMany({
    where: {
      emailQueueId: { in: idsToRevert },
    },
    data: {
      status: 'PENDING',
    },
  });

  return { jobsReverted: updateResult.count, workerRunning: false };
}
