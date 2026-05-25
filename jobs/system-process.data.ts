import { TSystemProcess } from '@/lib/types';
import { prisma } from '@/prisma';
import { Prisma } from '@prisma/client';
import z, { ZodType } from 'zod/v4';

export async function getSystemProcess<T>(
  processKey: string,
  parameterSchema: ZodType<T>,
): Promise<{ pid: number; tag: string; updatedAt: Date; parameter: T } | null>;

// Overload 2: No schema provided -> Return ONLY pid and tag
export async function getSystemProcess(processKey: string): Promise<{ pid: number; tag: string } | null>;

export async function getSystemProcess<T>(processKey: string, parameterSchema?: ZodType<T>) {
  try {
    const systemProcess = await prisma.systemProcess.findFirst({
      select: { pid: true, tag: true, parameter: !!parameterSchema, updatedAt: true },
      where: { key: processKey },
    });

    if (!systemProcess) {
      return null;
    }

    if (parameterSchema) {
      let parsedJson: JSON;
      try {
        parsedJson = JSON.parse(systemProcess.parameter as string);
      } catch (e) {
        console.error(`[Scheduler] Failed to parse JSON for ${processKey}`);
        return null;
      }

      const result = parameterSchema.safeParse(parsedJson);
      if (!result.success) {
        console.error(`[Scheduler] Validation failed for ${processKey}:`, z.treeifyError(result.error));
        return null;
      }

      return {
        pid: systemProcess.pid,
        tag: systemProcess.tag,
        updatedAt: systemProcess.updatedAt as Date,
        parameter: result.data,
      };
    }

    return {
      pid: systemProcess.pid,
      tag: systemProcess.tag,
    };
  } catch (err) {
    console.error('[Scheduler] Database error:', err);
    return null;
  }
}

/**
 * Save scheduler metadata to database
 */
export async function saveSystemProcess({
  pid,
  parameter,
  processTag,
  processKey,
  userId = 0,
}: {
  pid: number;
  parameter: string;
  processTag: string;
  processKey: TSystemProcess;
  userId?: number;
}) {
  const contextInfo = `[Key: ${processKey}, PID: ${pid}, User: ${userId}]`;

  try {
    // 1. Optimistically try to create it first.
    return await prisma.systemProcess.create({
      data: {
        pid,
        key: processKey,
        tag: processTag,
        parameter,
        createdBy: userId,
        updatedBy: userId,
      },
      select: { pid: true, tag: true, updatedAt: true },
    });
  } catch (err) {
    // 2. Handle known database errors
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      if (err.code === 'P2002') {
        try {
          // 3. Conflict found, fall back to update
          return await prisma.systemProcess.update({
            data: { pid, parameter, updatedBy: userId },
            where: { key: processKey },
            select: { pid: true, tag: true, updatedAt: true },
          });
        } catch (updateErr) {
          console.error(`[SystemProcess] Concurrency fallback update failed for ${contextInfo}:`, updateErr);
          throw new Error(`Failed to update existing system process metadata for key: ${processKey}`, { cause: updateErr });
        }
      }

      // Handle other Prisma codes (e.g., connection issues, foreign key constraints)
      console.error(`[SystemProcess] Database error during initial create ${contextInfo}:`, err);
      throw new Error(`Database error encountered while saving process metadata (Prisma code: ${err.code})`, { cause: err });
    }

    // 4. Handle unexpected/generic errors
    console.error(`[SystemProcess] Unexpected error during saveSystemProcess ${contextInfo}:`, err);
    throw new Error(`An unexpected error occurred while saving system process metadata`, { cause: err });
  }
}

export async function updateSystemProcess({
  processKey,
  pid,
  parameter,
  processTag,
  userId = 0,
}: {
  processKey: TSystemProcess;
  pid?: number;
  parameter?: string;
  processTag?: string;
  userId?: number;
}) {
  try {
    await prisma.systemProcess.update({
      data: { pid: pid, key: processKey, tag: processTag, parameter: parameter, createdBy: userId, updatedBy: userId },
      where: { key: processKey },
    });

    console.log(`[SystemProcess] Metadata saved - PID: ${pid}, Marker: ${processTag}`);
  } catch (err) {
    console.error('[SystemProcess] Failed to save metadata:', err);
  }
}

/**
 * Reset Database Record
 */
export async function resetSystemProcess(processKey: string) {
  try {
    await prisma.systemProcess.update({
      data: { pid: 0, updatedBy: 0 },
      where: { key: processKey },
    });

    console.log('[SystemProcess] System Process reset');
  } catch (err) {
    console.error('[SystemProcess] Failed to reset System Process:', err);
  }
}
