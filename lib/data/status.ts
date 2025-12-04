import { prisma } from "@/prisma";
import type { Prisma } from "@prisma/client";

export async function findManyStatus(where?: Prisma.StatusWhereInput) {
  return prisma.status.findMany({ where, select: { statusId: true, key: true, name: true, icon: true, color: true } });
}
