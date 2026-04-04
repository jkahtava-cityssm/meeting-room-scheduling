import { guardRoute } from '@/lib/api-guard';
import { CreatedMessage, InternalServerErrorMessage, SuccessMessage } from '@/lib/api-helpers';

import { createRoom, findFirstRoom, findManyRooms, upsertRoom } from '@/lib/data/rooms';
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
      const room = await prisma.$transaction(async (tx) => {
        const updatedRoom = await upsertRoom(
          {
            where: { roomId: data.roomId },
            create: {
              name: data.name,
              color: data.color,
              icon: data.icon,
              publicFacing: data.publicFacing,
              displayOrder: data.displayOrder,
              roomCategory: { connect: { roomCategoryId: data.roomCategoryId } },
            },
            update: {
              name: data.name,
              color: data.color,
              icon: data.icon,
              publicFacing: data.publicFacing,
              displayOrder: data.displayOrder,
              roomCategory: { connect: { roomCategoryId: data.roomCategoryId } },
            },
          },
          tx,
        );

        const roomId = updatedRoom.roomId;
        if (data.roomRoles) {
          const roleIds = data.roomRoles.map((r) => r.roleId);

          await tx.roomRole.deleteMany({
            where: { roomId, roleId: { notIn: roleIds } },
          });

          await tx.roomRole.createMany({
            data: roleIds.map((roleId) => ({ roomId, roleId })),
            skipDuplicates: true,
          });
        }
        if (data.roomProperty) {
          const propertyIds = data.roomProperty.map((p) => p.propertyId);

          await tx.roomProperty.deleteMany({
            where: { roomId, propertyId: { notIn: propertyIds } },
          });

          await Promise.all(
            data.roomProperty.map((prop) =>
              tx.roomProperty.upsert({
                where: { roomId_propertyId: { roomId, propertyId: prop.propertyId || -1 } },
                update: { value: prop.value },
                create: { roomId, value: prop.value, propertyId: Number(prop.propertyId) },
              }),
            ),
          );
        }

        return await findFirstRoom({ roomId }, tx);
      });

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
    async ({ data }) => {
      const room = await prisma.$transaction(async (tx) => {
        const createdRoom = await createRoom(
          {
            name: data.name,
            color: data.color,
            icon: data.icon,
            publicFacing: data.publicFacing,
            displayOrder: data.displayOrder,
            roomCategory: { connect: { roomCategoryId: data.roomCategoryId } },
          },
          tx,
        );

        const roomId = createdRoom.roomId;
        if (data.roomRoles) {
          const roleIds = data.roomRoles.map((r) => r.roleId);

          await tx.roomRole.createMany({
            data: roleIds.map((roleId) => ({ roomId, roleId })),
            skipDuplicates: true,
          });
        }

        if (data.roomProperty) {
          const propertyIds = data.roomProperty.map((p) => p.propertyId);

          await Promise.all(
            data.roomProperty.map((prop) =>
              tx.roomProperty.upsert({
                where: { roomId_propertyId: { roomId, propertyId: prop.propertyId || -1 } },
                update: { value: prop.value },
                create: { roomId, value: prop.value, propertyId: Number(prop.propertyId) },
              }),
            ),
          );
        }

        return await findFirstRoom({ roomId }, tx);
      });

      if (!room) {
        return InternalServerErrorMessage();
      }

      return CreatedMessage('Created Room', room);
    },
    SRoomPUT,
  );
}
