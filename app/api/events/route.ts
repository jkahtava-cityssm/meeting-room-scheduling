import { prisma } from '@/prisma';

import { NextRequest } from 'next/server';

import { UTCDate } from '@date-fns/utc';

import { BadRequestMessage, CreatedMessage, InternalServerErrorMessage, SuccessMessage } from '@/lib/api-helpers';
import { guardRoute } from '@/lib/api-guard';
import { Prisma } from '@prisma/client';
import { createEvent, upsertEvent, updateEvent, findManyEvents, findFirstEvent } from '@/lib/data/events';
import { createRecurrence, upsertRecurrence, deleteRecurrence } from '@/lib/data/recurrence';
import { SEventPATCH, SEventPUT } from '@/lib/services/events';

export async function POST(request: NextRequest) {
  return guardRoute(
    request,
    { CreateEvent: { type: 'permission', resource: 'Event', action: 'Create' } },

    async ({ data, sessionUserId }) => {
      const {
        eventId,

        userId,
        statusId,
        title,
        description,
        startDate,
        endDate,
        recurrenceId,
        rule,
        ruleDescription,
        ruleStartDate,
        ruleEndDate,
        eventItems,
        eventRecipients,
        eventRooms,
      } = data;

      let recurrence = null;

      if (rule && ruleStartDate && ruleEndDate && ruleDescription) {
        recurrence = await createRecurrence({ rule, description: ruleDescription, startDate: ruleStartDate, endDate: ruleEndDate }, sessionUserId);
      }

      const event = await createEvent(
        {
          title,
          description,
          startDate,
          endDate,
          roomIds: eventRooms,
          statusId,
          recurrenceId: recurrence?.recurrenceId,
          userId: userId,
          itemIds: eventItems,
          recipientIds: eventRecipients,
        },
        sessionUserId,
      );

      if (!event) {
        InternalServerErrorMessage();
      }

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
      const {
        userId,
        statusId,
        title,
        description,
        startDate,
        endDate,
        recurrenceId,
        rule,
        ruleDescription,
        ruleStartDate,
        ruleEndDate,
        eventRecipients,
        eventItems,
        eventRooms,
      } = data;

      const event = await prisma.$transaction(async (tx) => {
        let recurrence = null;

        if (rule && ruleStartDate && ruleEndDate && ruleDescription) {
          recurrence = await upsertRecurrence(
            {
              create: addCreateAudit({ rule, description: ruleDescription, startDate: ruleStartDate, endDate: ruleEndDate }, sessionUserId),
              where: { recurrenceId: recurrenceId ?? -1 },
              update: addUpdateAudit({ rule, description: ruleDescription, startDate: ruleStartDate, endDate: ruleEndDate }, sessionUserId),
            },
            tx,
          );
        } else if (recurrenceId) {
          await tx.recurrence.delete({ where: { recurrenceId } });
        }

        const event = await upsertEvent(
          {
            where: { eventId: data.eventId ?? -1 },
            create: {
              title,
              description,
              startDate,
              endDate,
              eventRooms: {
                createMany: {
                  data: eventRooms.map((roomId: number) => ({ roomId })),
                },
              },
              ...(recurrence && { recurrence: { connect: { recurrenceId: recurrence.recurrenceId } } }),
              status: { connect: { statusId: statusId } },
              ...(userId && { user: { connect: { id: userId } } }),
            },

            update: {
              title,
              description,
              startDate,
              endDate,
              status: { connect: { statusId } },
              recurrence: recurrence ? { connect: { recurrenceId: recurrence.recurrenceId } } : recurrenceId ? { disconnect: true } : undefined,
              ...(userId && { user: { connect: { id: userId } } }),
            },
          },
          tx,
        );

        const eventId = event.eventId;

        if (eventRooms) {
          await tx.eventRoom.deleteMany({
            where: { eventId, roomId: { notIn: eventRooms } },
          });

          await tx.eventRoom.createMany({
            data: addCreateManyAudit(
              eventRooms.map((roomId) => ({ eventId, roomId: roomId })),
              sessionUserId,
            ),
            skipDuplicates: true,
          });
        }

        if (eventRecipients) {
          await tx.eventRecipient.deleteMany({
            where: { eventId, eventRecipientId: { notIn: eventRecipients } },
          });

          await tx.eventRecipient.createMany({
            data: addCreateManyAudit(
              eventRecipients.map((eventRecipientId) => ({ eventId, userId: eventRecipientId })),
              sessionUserId,
            ),
            skipDuplicates: true,
          });
        }

        if (eventItems) {
          await tx.eventItem.deleteMany({
            where: { eventId, itemId: { notIn: eventItems } },
          });

          await tx.eventItem.createMany({
            data: addCreateManyAudit(
              eventItems.map((itemId) => ({ eventId, itemId })),
              sessionUserId,
            ),
            skipDuplicates: true,
          });
        }

        return await findFirstEvent({ eventId: eventId });
      });

      if (!event) {
        InternalServerErrorMessage();
      }

      if (event.eventId === data.eventId) {
        return SuccessMessage('Updated Event', event);
      }

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
      const {
        eventId,
        title,
        description,
        startDate,
        endDate,
        statusId,
        userId,
        recurrenceId,
        rule,
        ruleDescription,
        ruleStartDate,
        ruleEndDate,
        eventRooms,
      } = data;

      const event = await prisma.$transaction(async (tx) => {
        // 1. Handle Recurrence Logic
        let recurrence = undefined;
        if (rule && ruleStartDate && ruleEndDate && ruleDescription) {
          recurrence = await upsertRecurrence(
            {
              create: addCreateAudit({ rule, description: ruleDescription, startDate: ruleStartDate, endDate: ruleEndDate }, sessionUserId),
              where: { recurrenceId: recurrenceId || 0 },
              update: addUpdateAudit({ rule, description: ruleDescription, startDate: ruleStartDate, endDate: ruleEndDate }, sessionUserId),
            },
            tx,
          );
        }

        // 2. Build dynamic update object for Prisma
        const updateData: Prisma.EventUpdateInput = {
          ...(title !== undefined && { title }),
          ...(description !== undefined && { description }),
          ...(startDate !== undefined && { startDate }),
          ...(endDate !== undefined && { endDate }),
          ...(statusId !== undefined && { status: { connect: { statusId } } }),
          ...(userId !== undefined && { user: userId ? { connect: { id: userId } } : { disconnect: true } }),
          ...(recurrence && { recurrence: { connect: { recurrenceId: recurrence.recurrenceId } } }),
          ...(sessionUserId && { updatedByUser: { connect: { id: sessionUserId } } }),
        };

        // 3. Update the Event
        const updatedEvent = await tx.event.update({
          where: { eventId },
          data: updateData,
        });

        // 4. Handle Room updates if provided (Syncing the many-to-many)
        if (eventRooms) {
          await tx.eventRoom.deleteMany({
            where: { eventId, roomId: { notIn: eventRooms } },
          });
          await tx.eventRoom.createMany({
            data: addCreateManyAudit(
              eventRooms.map((roomId: number) => ({ eventId, roomId })),
              sessionUserId,
            ),
            skipDuplicates: true,
          });
        }

        return await findFirstEvent({ eventId }, tx);
      });

      if (!event) return InternalServerErrorMessage();

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
