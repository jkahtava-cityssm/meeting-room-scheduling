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

export async function upsertRecurrence(args: Prisma.RecurrenceUpsertArgs, tx: Prisma.TransactionClient = prisma) {
  return tx.recurrence.upsert(args);
}

export async function deleteRecurrence(args: Prisma.RecurrenceDeleteArgs, tx: Prisma.TransactionClient = prisma) {
  return tx.recurrence.delete(args);
}

export async function findRecurrence(args: Prisma.RecurrenceFindFirstArgs, tx: Prisma.TransactionClient = prisma) {
  return tx.recurrence.findFirst(args);
}
