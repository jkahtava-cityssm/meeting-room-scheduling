import { prisma } from '@/prisma';

import { NextRequest } from 'next/server';

import { UTCDate } from '@date-fns/utc';
import { TZDate } from '@date-fns/tz';

import { BadRequestMessage, CreatedMessage, InternalServerErrorMessage, SuccessMessage } from '@/lib/api-helpers';
import { guardRoute } from '@/lib/api-guard';
import { Prisma } from '@prisma/client';
import {
  createEvent,
  upsertEvent,
  findManyEvents,
  findFirstEvent,
  createManyEventRoom,
  createManyEventRecipients,
  createManyEventItems,
} from '@/lib/data/events';
import { createRecurrence, upsertRecurrence } from '@/lib/data/recurrence';
import { SEventPATCH, SEventPUT } from '@/lib/services/events';
import { sendEmail, sendEventNotificationEmail } from '@/lib/email';
import { findFirstUser, findManyUsers } from '@/lib/data/users';
import { format } from 'date-fns';
import { getDurationText } from '@/lib/helpers';
import { findManyRooms } from '@/lib/data/rooms';
import { findFirstStatus } from '@/lib/data/status';
import { TStatusKey } from '@/lib/types';

export async function POST(request: NextRequest) {
  return guardRoute(
    request,
    { CreateEvent: { type: 'permission', resource: 'Event', action: 'Create' } },

    async ({ data, sessionUserId }) => {
      const {
        userId,
        statusId,
        title,
        description,
        startDate,
        endDate,
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

      await sendEventNotificationEmail({
        userId: userId,
        eventRecipients: eventRecipients || [],
        eventRooms: eventRooms || [],
        statusId: statusId,
        startDate: startDate,
        endDate: endDate,
        title: title,
        action: 'CREATE',
        eventId: event.eventId,
      });

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
        eventRecipients,
        eventItems,
        eventRooms,
      } = data;

      await prisma.$transaction(async (tx) => {
        let recurrence = null;

        if (rule && ruleStartDate && ruleEndDate && ruleDescription) {
          recurrence = await upsertRecurrence(
            { recurrenceId, rule, description: ruleDescription, startDate: ruleStartDate, endDate: ruleEndDate },
            sessionUserId,
            tx,
          );
        } else if (recurrenceId) {
          await tx.recurrence.delete({ where: { recurrenceId } });
        }

        const event = await upsertEvent(
          {
            eventId: data.eventId,
            title,
            description,
            startDate,
            endDate,
            statusId,
            recurrenceId: recurrence?.recurrenceId,
            userId: userId,
          },
          sessionUserId,
          tx,
        );

        const eventId = event.eventId;

        if (eventRooms) {
          await tx.eventRoom.deleteMany({
            where: { eventId, roomId: { notIn: eventRooms } },
          });

          await createManyEventRoom(
            {
              eventId: eventId,
              eventRooms: eventRooms,
            },
            sessionUserId,
            tx,
          );
        }

        if (eventRecipients) {
          await tx.eventRecipient.deleteMany({
            where: { eventId, eventRecipientId: { notIn: eventRecipients } },
          });

          await createManyEventRecipients({ eventId: eventId, eventRecipients: eventRecipients }, sessionUserId, tx);
        }

        if (eventItems) {
          await tx.eventItem.deleteMany({
            where: { eventId, itemId: { notIn: eventItems } },
          });

          await createManyEventItems({ eventId: eventId, eventItems: eventItems }, sessionUserId, tx);
        }
      });

      const event = await findFirstEvent({ eventId: eventId });

      if (!event) {
        InternalServerErrorMessage();
      }

      if (event.eventId === data.eventId) {
        await sendEventNotificationEmail({
          userId: userId,
          eventRecipients: eventRecipients || [],
          eventRooms: eventRooms || [],
          statusId: statusId,
          startDate: startDate,
          endDate: endDate,
          title: title,
          action: 'UPDATE',
          eventId: event.eventId,
        });

        return SuccessMessage('Updated Event', event);
      }

      await sendEventNotificationEmail({
        userId: userId,
        eventRecipients: eventRecipients || [],
        eventRooms: eventRooms || [],
        statusId: statusId,
        startDate: startDate,
        endDate: endDate,
        title: title,
        action: 'CREATE',
        eventId: event.eventId,
      });
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

      await prisma.$transaction(async (tx) => {
        // 1. Handle Recurrence Logic
        let recurrence = undefined;
        if (rule && ruleStartDate && ruleEndDate && ruleDescription) {
          recurrence = await upsertRecurrence(
            { recurrenceId, rule, description: ruleDescription, startDate: ruleStartDate, endDate: ruleEndDate },
            sessionUserId,
            tx,
          );
        }

        // Build dynamic update object for Prisma
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
        await tx.event.update({
          where: { eventId },
          data: updateData,
        });

        if (eventRooms) {
          await tx.eventRoom.deleteMany({
            where: { eventId, roomId: { notIn: eventRooms } },
          });
          await createManyEventRoom(
            {
              eventId: eventId,
              eventRooms: eventRooms,
            },
            sessionUserId,
            tx,
          );
        }
      });

      const event = await findFirstEvent({ eventId });

      if (!event) return InternalServerErrorMessage();

      await sendEventNotificationEmail({
        userId: event.userId || undefined,
        eventRecipients: event.eventRecipients?.map((recipient) => recipient.userId) || [],
        eventRooms: event.eventRooms.map((room) => room.roomId) || [],
        statusId: event.statusId,
        startDate: new Date(event.startDate),
        endDate: new Date(event.endDate),
        title: event.title,
        action: 'STATUS_CHANGE',
        eventId: event.eventId,
      });

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
