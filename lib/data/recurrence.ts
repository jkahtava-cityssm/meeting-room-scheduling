import { prisma } from "@/prisma";
import type { Prisma } from "@prisma/client";

// Note: Recurrence DAL functions accept full args objects, allowing callers to specify
// their own include/select configuration. Consider standardizing include/select here if needed.

export async function createRecurrence(args: Prisma.RecurrenceCreateArgs) {
  return prisma.recurrence.create(args);
}

export async function upsertRecurrence(args: Prisma.RecurrenceUpsertArgs) {
  return prisma.recurrence.upsert(args);
}

export async function deleteRecurrence(args: Prisma.RecurrenceDeleteArgs) {
  return prisma.recurrence.delete(args);
}

export async function findRecurrence(args: Prisma.RecurrenceFindFirstArgs) {
  return prisma.recurrence.findFirst(args);
}
