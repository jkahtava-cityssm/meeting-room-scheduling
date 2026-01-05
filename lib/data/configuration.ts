import { prisma } from "@/prisma";
import type { Prisma } from "@prisma/client";
import { CONFIGURATION_KEYS, TConfigurationKeys } from "../types";

// Standard configuration select configuration — used across all DAL functions
const CONFIGURATION_SELECT = {
  key: true,
  value: true,
} as const satisfies Prisma.ConfigurationSelect;

export async function findManyConfiguration(
  keys: readonly TConfigurationKeys[]
): Promise<Partial<Record<TConfigurationKeys, string>>> {
  const where = {
    OR: keys.map((key) => ({ key })),
  };
  const configEntries = await prisma.configuration.findMany({ where, select: CONFIGURATION_SELECT });

  if (!configEntries || configEntries.length === 0) {
    return {};
  }

  return configEntries.reduce<Partial<Record<TConfigurationKeys, string>>>((acc, entry) => {
    const key = entry.key as TConfigurationKeys;
    acc[key] = String(entry.value);
    return acc;
  }, {});
}
