import { deleteManyEvents, findFirstEvent } from '@/lib/data/events';
import { BadRequestMessage, DeleteMessage, InternalServerErrorMessage, SuccessMessage } from '@/lib/api-helpers';
import { guardRoute } from '@/lib/api-guard';
import { NextRequest } from 'next/server';
import { sendEventNotificationEmail } from '@/lib/email';

export async function GET(request: NextRequest, { params }: { params: Promise<{ eventId: string }> }) {
  return guardRoute(request, { ReadEvent: { type: 'permission', resource: 'Event', action: 'Read All' } }, async () => {
    const { eventId } = await params;
    if (!eventId || isNaN(Number(eventId))) {
      return BadRequestMessage();
    }

    const event = await findFirstEvent({ eventId: parseInt(eventId) });

    if (!event) {
      return InternalServerErrorMessage();
    }

    return SuccessMessage('Collected Event', event);
  });
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ eventId: string }> }) {
  return guardRoute(
    request,
    { DeleteEvent: { type: 'permission', resource: 'Event', action: 'Delete' } },

    async ({ sessionUserId, permissionCache, permissions, sessionId }) => {
      const { eventId } = await params;
      if (!eventId || isNaN(Number(eventId))) {
        return BadRequestMessage();
      }

      const event = await findFirstEvent({ eventId: parseInt(eventId) });

      if (!event) return InternalServerErrorMessage();

      await sendEventNotificationEmail({
        userId: event.userId || undefined,
        eventRecipients: event.eventRecipients?.map((recipient) => recipient.userId) || [],
        eventRooms: event.eventRooms.map((room) => room.roomId) || [],
        statusId: event.statusId,
        startDate: new Date(event.startDate),
        endDate: new Date(event.endDate),
        title: event.title,
        action: 'DELETE',
        eventId: event.eventId,
      });

      const totalDeleted = await deleteManyEvents({ eventId: parseInt(eventId) });

      if (!totalDeleted) {
        return InternalServerErrorMessage();
      }

      return DeleteMessage();
    },
  );
}
