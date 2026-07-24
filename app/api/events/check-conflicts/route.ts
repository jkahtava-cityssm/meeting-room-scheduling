import { guardRoute } from '@/lib/api-guard';
import { SuccessMessage } from '@/lib/api-helpers';
import { findFirstConfiguration } from '@/lib/data/configuration';
import { getConflictingEvents } from '@/lib/data/events';
import { SEventConflictPOST } from '@/lib/services/events';
import { TStatusKey } from '@/lib/types';
import { NextRequest } from 'next/server';

export async function POST(req: NextRequest) {
  return guardRoute(
    req,
    { AllOf: { resource: 'Event', action: 'Change Status', type: 'permission' } },
    async ({ data }) => {
      const eventBufferSpan = await findFirstConfiguration('eventBufferSpan');

      const conflicts = await getConflictingEvents({
        roomIds: data.roomIds,
        startDate: data.startDate,
        endDate: data.endDate,
        statusKey: data.statusKey as TStatusKey,
        excludeEventId: data.excludeEventId,
        bufferMinutes: eventBufferSpan.value,
      });

      return SuccessMessage('Conflicts Checked', { hasConflict: conflicts.length > 0, conflicts: conflicts.map((conflict) => conflict.event) });
    },
    SEventConflictPOST,
  );
}
