import { prisma } from '@/prisma';
import { Prisma } from '@prisma/client';

export async function createRecurrence(
  data: { rule: string; description: string; startDate: Date; endDate: Date },
  sessionUserId: number,
  tx: Prisma.TransactionClient = prisma,
) {
  return tx.recurrence.create({
    data: {
      rule: data.rule,
      description: data.description,
      startDate: data.startDate,
      endDate: data.endDate,
      createdBy: sessionUserId,
      updatedBy: sessionUserId,
    },
  });
}

export async function upsertRecurrence(
  data: {
    recurrenceId?: number;
    rule: string;
    description: string;
    startDate: Date;
    endDate: Date;
  },
  sessionUserId: number,
  tx: Prisma.TransactionClient = prisma,
) {
  const contextInfo = `[RecurrenceId: ${data.recurrenceId ?? 'NEW'}, Rule: ${data.rule}, User: ${sessionUserId}]`;

  // Shared payload for mutations
  const sharedData = {
    rule: data.rule,
    description: data.description,
    startDate: data.startDate,
    endDate: data.endDate,
    updatedBy: sessionUserId,
  };

  // Scenario A: No recurrenceId provided means it is explicitly a brand new record
  if (!data.recurrenceId) {
    try {
      return await tx.recurrence.create({
        data: {
          ...sharedData,
          createdBy: sessionUserId,
        },
      });
    } catch (err) {
      console.error(`[Recurrence] Failed to create new recurrence schedule ${contextInfo}:`, err);
      throw new Error(`Database error encountered while creating new recurrence schedule`, { cause: err });
    }
  }

  // Scenario B: RecurrenceId exists, run the safe update-first strategy
  try {
    // Optimistically assume the record exists and update it
    return await tx.recurrence.update({
      where: { recurrenceId: data.recurrenceId },
      data: sharedData,
    });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      // P2025: Record to update not found (concurrency race condition)
      if (err.code === 'P2025') {
        try {
          return await tx.recurrence.create({
            data: {
              ...sharedData,
              createdBy: sessionUserId,
            },
          });
        } catch (createErr) {
          console.error(`[Recurrence] Concurrency fallback create failed for ${contextInfo}:`, createErr);
          throw new Error(`Failed to create recurrence schedule after missing update check`, { cause: createErr });
        }
      }

      console.error(`[Recurrence] Database error during update ${contextInfo}:`, err);
      throw new Error(`Database error while updating recurrence data (Prisma code: ${err.code})`, { cause: err });
    }

    // Handle unexpected/generic errors
    console.error(`[Recurrence] Unexpected error during upsertRecurrence ${contextInfo}:`, err);
    throw new Error(`An unexpected error occurred while saving recurrence rules`, { cause: err });
  }
}

export async function deleteRecurrence(args: Prisma.RecurrenceDeleteArgs, tx: Prisma.TransactionClient = prisma) {
  return tx.recurrence.delete(args);
}

export async function findRecurrence(args: Prisma.RecurrenceFindFirstArgs, tx: Prisma.TransactionClient = prisma) {
  return tx.recurrence.findFirst(args);
}
