import { NextRequest } from 'next/server';
import { findManyConfiguration, upsertConfiguration } from '@/lib/data/configuration';
import { BadRequestMessage, InternalServerErrorMessage, SuccessMessage } from '@/lib/api-helpers';
import { guardRoute } from '@/lib/api-guard';
import { CONFIGURATION_KEYS, TConfigurationKeys } from '@/lib/types';
import { SConfigurationPUT } from '@/lib/services/configuration';
import z from 'zod/v4';
import { prisma } from '@/prisma';

function parseRequestedKeys(request: NextRequest): readonly TConfigurationKeys[] {
  const url = new URL(request.url);
  const keysParams = url.searchParams.getAll('keys');

  // If no keys provided, return all
  if (keysParams.length === 0) {
    return CONFIGURATION_KEYS;
  }

  // Filter invalid values and narrow to TConfigurationKeys
  const valid = keysParams.filter((k): k is TConfigurationKeys => (CONFIGURATION_KEYS as readonly string[]).includes(k));

  // If after filtering there are none, default to all
  return valid.length > 0 ? valid : CONFIGURATION_KEYS;
}

export async function GET(request: NextRequest) {
  return guardRoute(request, { LoggedIn: { type: 'role', role: 'Private' } }, async ({ sessionUserId, permissionCache, permissions, sessionId }) => {
    const requestedKeys = parseRequestedKeys(request);

    const configEntries = await findManyConfiguration(requestedKeys);

    if (!configEntries) {
      return InternalServerErrorMessage();
    }

    return SuccessMessage('Collected Configuration', configEntries);
  });
}

export async function PUT(request: NextRequest) {
  return guardRoute(
    request,
    {
      EditPermission: { type: 'permission', resource: 'Settings', action: 'Edit Permissions' },
    },
    async ({ data }) => {
      try {
        const results = await prisma.$transaction(
          async (tx) =>
            await Promise.all(
              data.map((configurationPairs) => {
                return upsertConfiguration(
                  {
                    where: { key: configurationPairs.key },
                    create: {
                      key: configurationPairs.key,
                      value: configurationPairs.value,
                      name: configurationPairs.name,
                      type: configurationPairs.type,
                      description: configurationPairs.description,
                    },
                    update: {
                      value: configurationPairs.value,
                    },
                  },
                  tx,
                );
              }),
            ),
        );

        return SuccessMessage('Updated Configurations', results);
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error occurred';
        return BadRequestMessage(message);
      }
    },
    z.array(SConfigurationPUT),
  );
}
