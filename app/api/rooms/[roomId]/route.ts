import {
  BadRequestMessage,
  CreatedMessage,
  DeleteMessage,
  InternalServerErrorMessage,
  SuccessMessage,
} from "@/lib/api-helpers";
import { guardRoute } from "@/lib/api-guard";
import { NextRequest } from "next/server";
import { deleteManyRooms, findFirstRoom, findManyRooms, upsertRoom } from "@/lib/data/rooms";
import { prisma } from "@/prisma";
import { SRoomPUT } from "@/lib/services/rooms";

export async function GET(request: NextRequest, { params }: { params: Promise<{ roomId: string }> }) {
  return guardRoute(
    request,
    { EditRooms: { type: "permission", resource: "Settings", action: "Edit Rooms" } },

    async ({ sessionUserId, permissionCache, permissions, sessionId }) => {
      const { roomId } = await params;

      if (!roomId || isNaN(Number(roomId))) {
        return BadRequestMessage();
      }

      const room = await findManyRooms({ roomId: parseInt(roomId) });

      if (!room) {
        return InternalServerErrorMessage();
      }

      return SuccessMessage("Collected Room", room);
    },
  );
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ roomId: string }> }) {
  return guardRoute(
    request,
    { EditRooms: { type: "permission", resource: "Settings", action: "Edit Rooms" } },

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

export async function PUT(request: NextRequest) {
  return guardRoute(
    request,
    { EditRooms: { type: "permission", resource: "Settings", action: "Edit Rooms" } },
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
              roomCategory: { connect: { roomCategoryId: data.roomCategoryId } },
            },
            update: {
              name: data.name,
              color: data.color,
              icon: data.icon,
              publicFacing: data.publicFacing,
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
          const propertyIds = data.roomProperty.map((p) => p.roomPropertyId).filter((id): id is number => !!id);

          await tx.roomProperty.deleteMany({
            where: { roomId, roomPropertyId: { notIn: propertyIds } },
          });

          await Promise.all(
            data.roomProperty.map((prop) =>
              tx.roomProperty.upsert({
                where: { roomPropertyId: prop.roomPropertyId || -1 },
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
        return SuccessMessage("Updated Event", room);
      }

      return CreatedMessage("Created Event", room);
    },
    SRoomPUT,
  );
}
