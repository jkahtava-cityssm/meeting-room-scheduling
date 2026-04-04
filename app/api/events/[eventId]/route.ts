import { findManyEvents, deleteManyEvents, findFirstEvent } from '@/lib/data/events';
import { BadRequestMessage, DeleteMessage, InternalServerErrorMessage, SuccessMessage } from '@/lib/api-helpers';
import { guardRoute } from '@/lib/api-guard';
import { NextRequest } from 'next/server';

export async function GET(request: NextRequest, { params }: { params: Promise<{ eventId: string }> }) {
  return guardRoute(
    request,
    { ReadEvent: { type: 'permission', resource: 'Event', action: 'Read All' } },
    async ({ sessionUserId, permissionCache, permissions, sessionId }) => {
      const { eventId } = await params;
      if (!eventId || isNaN(Number(eventId))) {
        return BadRequestMessage();
      }

      const event = await findFirstEvent({ eventId: parseInt(eventId) });

      if (!event) {
        return InternalServerErrorMessage();
      }

      return SuccessMessage('Collected Event', event);
    },
  );
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

      const totalDeleted = await deleteManyEvents({ eventId: parseInt(eventId) });

      if (!totalDeleted) {
        return InternalServerErrorMessage();
      }

      return DeleteMessage();
    },
  );
}
