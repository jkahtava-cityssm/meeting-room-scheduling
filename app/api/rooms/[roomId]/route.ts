import { BadRequestMessage, CreatedMessage, DeleteMessage, InternalServerErrorMessage, SuccessMessage } from '@/lib/api-helpers';
import { guardRoute } from '@/lib/api-guard';
import { NextRequest } from 'next/server';
import { deleteManyRooms, findFirstRoom, findManyRooms, upsertRoom } from '@/lib/data/rooms';
import { prisma } from '@/prisma';
import { SRoomPUT } from '@/lib/services/rooms';

export async function GET(request: NextRequest, { params }: { params: Promise<{ roomId: string }> }) {
  return guardRoute(
    request,
    { EditRooms: { type: 'permission', resource: 'Settings', action: 'Edit Rooms' } },

    async ({ sessionUserId, permissionCache, permissions, sessionId }) => {
      const { roomId } = await params;

      if (!roomId || isNaN(Number(roomId))) {
        return BadRequestMessage();
      }

      const room = await findManyRooms({ roomId: parseInt(roomId) });

      if (!room) {
        return InternalServerErrorMessage();
      }

      return SuccessMessage('Collected Room', room);
    },
  );
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ roomId: string }> }) {
  return guardRoute(
    request,
    { EditRooms: { type: 'permission', resource: 'Settings', action: 'Edit Rooms' } },

    async ({ sessionUserId, permissionCache, permissions, sessionId }) => {
      const { roomId } = await params;
      if (!roomId || isNaN(Number(roomId))) {
        return BadRequestMessage();
      }

      const totalDeleted = await deleteManyRooms({ roomId: parseInt(roomId) });

      if (!totalDeleted) {
        return InternalServerErrorMessage();
      }

      return DeleteMessage();
    },
  );
}
