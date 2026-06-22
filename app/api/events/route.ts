import { NextRequest } from 'next/server';

import { UTCDate } from '@date-fns/utc';

import { BadRequestMessage, CreatedMessage, InternalServerErrorMessage, SuccessMessage } from '@/lib/api-helpers';
import { guardRoute } from '@/lib/api-guard';

import { upsertEvent, findManyEvents, patchEvent } from '@/lib/data/events';

import { SEventPATCH, SEventPUT } from '@/lib/services/events';

import { createEmailQueue } from '@/lib/data/email';

export async function POST(request: NextRequest) {
  return guardRoute(
    request,
    { CreateEvent: { type: 'permission', resource: 'Event', action: 'Create' } },

    async ({ data, sessionUserId }) => {
      const event = await upsertEvent(data, sessionUserId);

      if (!event) {
        InternalServerErrorMessage();
      }

      await createEmailQueue(event, 'CREATE');

      return CreatedMessage('Created Event', event);
    },
    SEventPUT,
  );
}

export async function PUT(request: NextRequest) {
  return guardRoute(
    request,
    {
      UpdateEvent: { type: 'permission', resource: 'Event', action: 'Update' },
    },
    async ({ sessionUserId, permissionCache, permissions, sessionId, data }) => {
      const event = await upsertEvent(data, sessionUserId);

      if (!event) {
        InternalServerErrorMessage();
      }

      if (event.eventId === data.eventId) {
        await createEmailQueue(event, 'UPDATE');

        return SuccessMessage('Updated Event', event);
      }

      await createEmailQueue(event, 'CREATE');

      return CreatedMessage('Created Event', event);
    },
    SEventPUT,
  );
}

export async function PATCH(request: NextRequest) {
  return guardRoute(
    request,
    {
      UpdateEvent: { type: 'permission', resource: 'Event', action: 'Update' },
    },
    async ({ sessionUserId, data }) => {
      const event = await patchEvent(data, sessionUserId);

      if (!event) return BadRequestMessage();

      await createEmailQueue(event, 'STATUS_CHANGE');

      return SuccessMessage('Event updated successfully', event);
    },
    SEventPATCH,
  );
}

export async function GET(request: NextRequest) {
  return guardRoute(
    request,
    { ReadEvent: { type: 'permission', resource: 'Event', action: 'Read All' } },

    async ({ sessionUserId, permissionCache, permissions, sessionId }) => {
      const searchParams = request.nextUrl.searchParams;

      const startDateParam = searchParams.get('startdate');
      const endDateParam = searchParams.get('enddate');
      const hasUserId = searchParams.get('userId');

      if (!startDateParam || !endDateParam) {
        return BadRequestMessage();
      }

      const StartDate: UTCDate = new UTCDate(startDateParam);
      const EndDate: UTCDate = new UTCDate(endDateParam);

      const whereClause: import('@prisma/client').Prisma.EventWhereInput = {
        OR: [
          {
            startDate: { lte: EndDate },
            endDate: { gte: StartDate },
          },
          {
            recurrence: {
              startDate: { lte: EndDate },
              endDate: { gte: StartDate },
            },
          },
        ],
      };

      if (hasUserId) {
        whereClause.AND = [{ userId: { equals: Number(sessionUserId) } }];
      }

      const events = await findManyEvents(whereClause);

      if (!events) {
        return InternalServerErrorMessage();
      }

      return SuccessMessage('Collected Events', events);
    },
  );
}
