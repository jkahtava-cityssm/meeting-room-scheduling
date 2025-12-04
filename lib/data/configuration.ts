import { prisma } from "@/prisma";
import type { Prisma } from "@prisma/client";

export async function findManyConfiguration(where?: Prisma.ConfigurationWhereInput) {
  return prisma.configuration.findMany({ where, select: { key: true, value: true } });
}
