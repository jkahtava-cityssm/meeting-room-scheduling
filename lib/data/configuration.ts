import { prisma } from "@/prisma";
import type { Prisma } from "@prisma/client";
import { CONFIGURATION_KEYS, TConfigurationKeys } from "../types";
import { z } from "zod/v4";

export const SConfigurationEntry = z.discriminatedUnion("type", [
  z.object({
    key: z.string(),
    type: z.literal("boolean"),
    value: z.preprocess((val) => val === "true" || val === true, z.boolean()),
    description: z.string().nullable(),
  }),

  z.object({
    key: z.string(),
    type: z.literal("number"),
    value: z.preprocess((val) => Number(val), z.number()),
    description: z.string().nullable(),
  }),

  z.object({
    key: z.string(),
    type: z.literal("string"),
    value: z.string(),
    description: z.string().nullable(),
  }),
]);

export type TConfigurationEntry = z.infer<typeof SConfigurationEntry>;

const CONFIGURATION_SELECT = {
  key: true,
  value: true,
  type: true,
  description: true,
} as const satisfies Prisma.ConfigurationSelect;

export interface IConfigurationRecord {
  value: string | number | boolean;
  type: "string" | "number" | "boolean";
  description: string;
}

export async function findManyConfiguration(keys: readonly TConfigurationKeys[]): Promise<IConfigurationRecord[]> {
  const where = {
    OR: keys.map((key) => ({ key })),
  };
  const configEntries = await prisma.configuration.findMany({ where, select: CONFIGURATION_SELECT });

  return configEntries.map((entry) => ({
    key: entry.key as TConfigurationKeys,
    value: entry.value,
    type: entry.type as "string" | "number" | "boolean",
    description: entry.description ?? "",
  }));
}
