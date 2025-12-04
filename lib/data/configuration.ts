import { prisma } from "@/prisma";
import type { Prisma } from "@prisma/client";

// Standard configuration select configuration — used across all DAL functions
const CONFIGURATION_SELECT = {
  key: true,
  value: true,
} as const satisfies Prisma.ConfigurationSelect;

export async function findManyConfiguration(where?: Prisma.ConfigurationWhereInput) {
  return prisma.configuration.findMany({ where, select: CONFIGURATION_SELECT });
}
