import { prisma } from '@/prisma';

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
 * Save scheduler metadata to database
 */
export async function saveSystemProcess(pid: number, parameter: string, processTag: string, processKey: string, userId: number = 0) {
  try {
    const process = await prisma.systemProcess.upsert({
      create: { pid, key: processKey, tag: processTag, parameter: parameter, createdBy: userId, updatedBy: userId },
      update: { pid, parameter: parameter, updatedBy: userId },
      where: { key: processKey },
    });

    console.log(`[Scheduler] Metadata saved - PID: ${pid}, Marker: ${processTag}`);
  } catch (err) {
    console.error('[Scheduler] Failed to save metadata:', err);
  }
}

export async function updateSystemProcess(processKey: string, pid?: number, parameter?: string, processTag?: string, userId: number = 0) {
  try {
    const process = await prisma.systemProcess.update({
      data: { pid: pid, key: processKey, tag: processTag, parameter: parameter, createdBy: userId, updatedBy: userId },
      where: { key: processKey },
    });

    console.log(`[Scheduler] Metadata saved - PID: ${pid}, Marker: ${processTag}`);
  } catch (err) {
    console.error('[Scheduler] Failed to save metadata:', err);
  }
}

/**
 * Reset Database Record
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
