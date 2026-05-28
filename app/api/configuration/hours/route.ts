import { findManyConfiguration } from '@/lib/data/configuration';

import { NextRequest } from 'next/server';
import { InternalServerErrorMessage, SuccessMessage, validateVisibleHours } from '@/lib/api-helpers';
import { guardRoute } from '@/lib/api-guard';
import { TConfigurationKeys } from '@/lib/types';

export async function GET(request: NextRequest) {
  return guardRoute(request, { IsPublic: { type: 'role', role: 'Public' } }, async () => {
    const config = await findManyConfiguration(['visibleHoursStart', 'visibleHoursEnd']);

    if (!config) {
      return InternalServerErrorMessage();
    }

    const flatMap = config.reduce<Partial<Record<TConfigurationKeys, string>>>((acc, entry) => {
      const key = entry.key as TConfigurationKeys;
      acc[key] = String(entry.value);
      return acc;
    }, {});

    const { visibleHoursStart, visibleHoursEnd } = validateVisibleHours(Number(flatMap.visibleHoursStart), Number(flatMap.visibleHoursEnd));

    return SuccessMessage('Collected Hours', { from: visibleHoursStart, to: visibleHoursEnd });
  });
}
