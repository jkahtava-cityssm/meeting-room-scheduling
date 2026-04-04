import { prisma } from '@/prisma';
import type { Prisma } from '@prisma/client';

// Standard status select configuration — used across all DAL functions
const STATUS_SELECT = {
  statusId: true,
  key: true,
  name: true,
  icon: true,
  color: true,
} as const satisfies Prisma.StatusSelect;

export async function findManyStatus(where?: Prisma.StatusWhereInput, tx: Prisma.TransactionClient = prisma) {
  return tx.status.findMany({ where, select: STATUS_SELECT, orderBy: { statusId: 'asc' } });
}
