import { prisma } from "@/prisma";
import type { Prisma } from "@prisma/client";

// Note: Recurrence DAL functions accept full args objects, allowing callers to specify
// their own include/select configuration. Consider standardizing include/select here if needed.

export async function createRecurrence(args: Prisma.RecurrenceCreateArgs, tx: Prisma.TransactionClient = prisma) {
  return tx.recurrence.create(args);
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
