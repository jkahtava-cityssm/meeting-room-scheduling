import { guardRoute } from '@/lib/api-guard';
import { CreatedMessage, InternalServerErrorMessage, SuccessMessage } from '@/lib/api-helpers';

import { createManyRoomRole, createRoom, findFirstRoom, findManyRooms, upsertRoom, upsertRoomProperty } from '@/lib/data/rooms';
import { SRoomPUT } from '@/lib/services/rooms';
import { prisma } from '@/prisma';
import { NextRequest } from 'next/server';

export async function GET(req: NextRequest) {
  return guardRoute(
    req,
    {
      AllOf: [{ ReadRoom: { type: 'permission', resource: 'Room', action: 'Read' } }],
    },

    async ({ sessionUserId, permissionCache, permissions, sessionId, data }) => {
      const roomFilter = permissionCache.isAdmin
        ? {}
        : {
            OR: [{ roomRoles: { some: { roleId: { in: Array.from(permissionCache.roleIdSet || []) } } } }, { roomRoles: { none: {} } }],
          };

      const rooms = await findManyRooms(roomFilter);

      if (!rooms) {
        return InternalServerErrorMessage();
      }

      return SuccessMessage('Collected Rooms', rooms);
    },
  );
}

export async function PUT(request: NextRequest) {
  return guardRoute(
    request,
    {
      AnyOf: [
        { UpdateRooms: { type: 'permission', resource: 'Room', action: 'Update' } },
        { EditRooms: { type: 'permission', resource: 'Settings', action: 'Edit Rooms' } },
      ],
    },
    async ({ sessionUserId, permissionCache, permissions, sessionId, data }) => {
      const roomId = await prisma.$transaction(async (tx) => {
        const updatedRoom = await upsertRoom(
          {
            roomId: data.roomId,
            name: data.name,
            color: data.color,
            icon: data.icon,
            publicFacing: data.publicFacing,
            displayOrder: data.displayOrder,
            roomCategoryId: data.roomCategoryId,
          },
          sessionUserId,
          tx,
        );

        const roomId = updatedRoom.roomId;
        if (data.roomRoles) {
          const roleIds = data.roomRoles.map((r) => r.roleId);

          await tx.roomRole.deleteMany({
            where: { roomId, roleId: { notIn: roleIds } },
          });

          await createManyRoomRole(
            roleIds.map((roleId) => ({ roomId, roleId })),
            sessionUserId,
            tx,
          );
        }
        if (data.roomProperty) {
          const propertyIds = data.roomProperty.map((p) => p.propertyId);

          await tx.roomProperty.deleteMany({
            where: { roomId, propertyId: { notIn: propertyIds } },
          });

          await Promise.all(data.roomProperty.map((prop) => upsertRoomProperty(roomId, prop.propertyId, prop.value, sessionUserId, tx)));
        }
        return roomId;
      });

      const room = await findFirstRoom({ roomId });

      if (!room) {
        return InternalServerErrorMessage();
      }

      if (room.roomId === data.roomId) {
        return SuccessMessage('Updated Event', room);
      }

      return CreatedMessage('Created Event', room);
    },
    SRoomPUT,
  );
}

export async function POST(request: NextRequest) {
  return guardRoute(
    request,
    {
      AnyOf: [
        { CreateRooms: { type: 'permission', resource: 'Room', action: 'Create' } },
        { EditRooms: { type: 'permission', resource: 'Settings', action: 'Edit Rooms' } },
      ],
    },
    async ({ sessionUserId, data }) => {
      const roomId = await prisma.$transaction(async (tx) => {
        const createdRoom = await createRoom(
          {
            name: data.name,
            color: data.color,
            icon: data.icon,
            publicFacing: data.publicFacing,
            displayOrder: data.displayOrder,
            roomCategory: { connect: { roomCategoryId: data.roomCategoryId } },
          },
          sessionUserId,

          tx,
        );

        const roomId = createdRoom.roomId;
        if (data.roomRoles) {
          const roleIds = data.roomRoles.map((r) => r.roleId);

          await createManyRoomRole(
            roleIds.map((roleId) => ({ roomId, roleId })),
            sessionUserId,
            tx,
          );
        }

        if (data.roomProperty) {
          const propertyIds = data.roomProperty.map((p) => p.propertyId);

          await Promise.all(data.roomProperty.map((prop) => upsertRoomProperty(roomId, prop.propertyId, prop.value, sessionUserId, tx)));
        }

        return roomId;
      });

      const room = await findFirstRoom({ roomId });
      if (!room) {
        return InternalServerErrorMessage();
      }

      return CreatedMessage('Created Room', room);
    },
    SRoomPUT,
  );
}
