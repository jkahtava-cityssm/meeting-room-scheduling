import { findManyEvents } from '@/lib/data/events';

import { NextRequest } from 'next/server';

import { UTCDate } from '@date-fns/utc';

import { BadRequestMessage, CreatedMessage, InternalServerErrorMessage, SuccessMessage } from '@/lib/api-helpers';
import { guardRoute } from '@/lib/api-guard';

export async function GET(request: NextRequest) {
  return guardRoute(
    request,
    { IsPublic: { type: 'role', role: 'Public' } },

    async ({ sessionUserId, permissionCache, permissions, sessionId }) => {
      const searchParams = request.nextUrl.searchParams;

      const startDateParam = searchParams.get('startdate');
      const endDateParam = searchParams.get('enddate');
      const statusId = searchParams.get('statusId');

      if (!startDateParam || !endDateParam || !statusId) {
        return BadRequestMessage();
      }

      const StartDate: UTCDate = new UTCDate(startDateParam);
      const EndDate: UTCDate = new UTCDate(endDateParam);

      /*const whereClause: import("@prisma/client").Prisma.EventWhereInput = {
        OR: [
          {
            startDate: { lte: EndDate, gte: StartDate },
            //endDate: { gte: StartDate },
          },
          {
            recurrence: {
              startDate: { gte: StartDate, lte: EndDate },
              //endDate: { gte: StartDate },
            },
          },
        ],
        AND: [{ statusId: Number(statusId) }],
      };*/

      const whereClause: import('@prisma/client').Prisma.EventWhereInput = {
        AND: [
          {
            createdAt: { lte: EndDate, gte: StartDate },
          },
          { statusId: Number(statusId) },
        ],
      };
      const events = await findManyEvents(whereClause);

      if (!events) {
        return InternalServerErrorMessage();
      }

      return SuccessMessage('Collected Events', events);
    },
  );
}
