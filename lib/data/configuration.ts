import { prisma } from '@/prisma';
import { Prisma } from '@prisma/client';
import { TConfigurationKeys } from '../types';
import { z } from 'zod/v4';

export const SConfigurationEntry = z.discriminatedUnion('type', [
  z.object({
    key: z.string(),
    name: z.string(),
    type: z.literal('boolean'),
    value: z.union([z.boolean(), z.stringbool()]), //z.preprocess((val) => val === "true" || val === true, z.boolean()),
    description: z.string().nullable(),
  }),

  z.object({
    key: z.string(),
    name: z.string(),
    type: z.literal('number'),
    value: z.preprocess((val) => Number(val), z.number()),
    description: z.string().nullable(),
  }),

  z.object({
    key: z.string(),
    name: z.string(),
    type: z.literal('string'),
    value: z.string(),
    description: z.string().nullable(),
  }),
]);

export type TConfigurationEntry = z.infer<typeof SConfigurationEntry>;

const CONFIGURATION_SELECT = {
  key: true,
  name: true,
  value: true,
  type: true,
  description: true,
} as const satisfies Prisma.ConfigurationSelect;

export interface IConfigurationRecord {
  key: TConfigurationKeys;
  name: string;
  value: string | number | boolean;
  type: 'string' | 'number' | 'boolean';
  description: string;
}

export async function findManyConfiguration(
  keys: readonly TConfigurationKeys[],
  tx: Prisma.TransactionClient = prisma,
): Promise<IConfigurationRecord[]> {
  const where = {
    OR: keys.map((key) => ({ key })),
  };
  const configEntries = await tx.configuration.findMany({
    where,
    select: CONFIGURATION_SELECT,
    orderBy: { configurationId: 'asc' },
  });

  return configEntries.map((entry) => ({
    key: entry.key as TConfigurationKeys,
    name: entry.name,
    value: entry.value,
    type: entry.type as 'string' | 'number' | 'boolean',
    description: entry.description ?? '',
  }));
}

export async function findFirstConfiguration(key: TConfigurationKeys, tx: Prisma.TransactionClient = prisma): Promise<IConfigurationRecord> {
  const configEntry = await tx.configuration.findFirstOrThrow({
    where: { key: key },
    select: CONFIGURATION_SELECT,
    orderBy: { configurationId: 'asc' },
  });

  return {
    key: configEntry.key as TConfigurationKeys,
    name: configEntry.name,
    value: configEntry.value,
    type: configEntry.type as 'string' | 'number' | 'boolean',
    description: configEntry.description ?? '',
  };
}

export async function upsertConfiguration(
  data: {
    key: string;
    value: string;
    name: string;
    type: string;
    description: string;
  },
  sessionUserId: number,
  tx: Prisma.TransactionClient = prisma,
) {
  const contextInfo = `[ConfigKey: ${data.key}, User: ${sessionUserId}]`;

  try {
    // 1. Optimistically try to create the configuration row first
    return await tx.configuration.create({
      data: {
        key: data.key,
        value: data.value,
        name: data.name,
        type: data.type,
        description: data.description,
        createdBy: sessionUserId,
        updatedBy: sessionUserId,
      },
      select: CONFIGURATION_SELECT,
    });
  } catch (err) {
    // 2. Handle known database errors
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      if (err.code === 'P2002') {
        try {
          // 3. Conflict found (it already exists), safely fall back to an update
          return await tx.configuration.update({
            where: { key: data.key },
            data: {
              value: data.value,
              updatedBy: sessionUserId,
            },
            select: CONFIGURATION_SELECT,
          });
        } catch (updateErr) {
          console.error(`[Configuration] Concurrency fallback update failed for ${contextInfo}:`, updateErr);
          throw new Error(`Failed to update existing configuration for key: ${data.key}`, { cause: updateErr });
        }
      }

      console.error(`[Configuration] Database error during initial create ${contextInfo}:`, err);
      throw new Error(`Database error encountered while saving configuration (Prisma code: ${err.code})`, { cause: err });
    }

    // 4. Handle unexpected/generic errors
    console.error(`[Configuration] Unexpected error during upsertConfiguration ${contextInfo}:`, err);
    throw new Error(`An unexpected error occurred while saving configuration`, { cause: err });
  }
}

export async function updateConfiguration(
  data: {
    key: string;
    value: string;
  },
  sessionUserId: number,
  tx: Prisma.TransactionClient = prisma,
) {
  return tx.configuration.update({
    where: { key: data.key },
    data: {
      value: data.value,
      updatedBy: sessionUserId,
    },
    select: CONFIGURATION_SELECT,
  });
}

export async function deleteSSOProvider(
  data: {
    provider: string;
  },
  sessionUserId: number,
  tx: Prisma.TransactionClient = prisma,
) {
  return tx.sSOProvider.deleteMany({ where: { providerId: data.provider } });
}
