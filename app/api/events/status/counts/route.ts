import { countEvents } from '@/lib/data/events';

import { NextRequest } from 'next/server';

import { UTCDate } from '@date-fns/utc';

import { BadRequestMessage, InternalServerErrorMessage, SuccessMessage } from '@/lib/api-helpers';
import { guardRoute } from '@/lib/api-guard';

export async function GET(request: NextRequest) {
  return guardRoute(
    request,
    { IsPublic: { type: 'role', role: 'Public' } },

    async ({ sessionUserId, permissionCache, permissions, sessionId }) => {
      const searchParams = request.nextUrl.searchParams;

      const startDateParam = searchParams.get('startdate');
      const endDateParam = searchParams.get('enddate');
      const statusKey = searchParams.get('statusKey');

      if (!statusKey) {
        return BadRequestMessage();
      }

      const timeClause =
        startDateParam && endDateParam
          ? {
              createdAt: { lte: new UTCDate(endDateParam), gte: new UTCDate(startDateParam) },
            }
          : {};

      const whereClause: import('@prisma/client').Prisma.EventWhereInput = {
        AND: [timeClause, { status: { key: statusKey } }],
      };
      const total = await countEvents(whereClause);

      if (total === undefined || total === null) {
        return InternalServerErrorMessage();
      }

      return SuccessMessage('Collected Total Events', { total });
    },
  );
}
