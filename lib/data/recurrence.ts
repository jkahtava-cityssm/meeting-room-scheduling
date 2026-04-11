import { prisma } from '@/prisma';
import type { Prisma } from '@prisma/client';

export async function createRecurrence(
  data: { rule: string; description: string; startDate: Date; endDate: Date },
  sessionUserId: number,
  tx: Prisma.TransactionClient = prisma,
) {
  return tx.recurrence.create({
    data: { rule: data.rule, description: data.description, startDate: data.startDate, endDate: data.endDate, createdBy: sessionUserId },
  });
}

export async function upsertRecurrence(
  data: { recurrenceId?: number; rule: string; description: string; startDate: Date; endDate: Date },
  sessionUserId: number,
  tx: Prisma.TransactionClient = prisma,
) {
  return tx.recurrence.upsert({
    where: { recurrenceId: data.recurrenceId },
    create: {
      rule: data.rule,
      description: data.description,
      startDate: data.startDate,
      endDate: data.endDate,
      createdBy: sessionUserId,
      updatedBy: sessionUserId,
    },
    update: { rule: data.rule, description: data.description, startDate: data.startDate, endDate: data.endDate, updatedBy: sessionUserId },
  });
}

export async function deleteRecurrence(args: Prisma.RecurrenceDeleteArgs, tx: Prisma.TransactionClient = prisma) {
  return tx.recurrence.delete(args);
}

export async function findRecurrence(args: Prisma.RecurrenceFindFirstArgs, tx: Prisma.TransactionClient = prisma) {
  return tx.recurrence.findFirst(args);
}
