import { prisma } from "@/prisma";
import type { Prisma } from "@prisma/client";
import { IRoom } from "../schemas/calendar";

// Standard room select configuration — used across all DAL functions
const ROOM_SELECT = {
  roomId: true,
  name: true,
  color: true,
  icon: true,
  publicFacing: true,
  roomCategoryId: true,
  roomCategory: { select: { roomCategoryId: true, name: true, createdAt: true, updatedAt: true } },
  roomRoles: { select: { roomRoleId: true, roleId: true, createdAt: true, updatedAt: true } },
  roomProperty: {
    select: {
      roomPropertyId: true,
      value: true,
      createdAt: true,
      updatedAt: true,
      property: { select: { propertyId: true, name: true, type: true } },
    },
  },
  createdAt: true,
  updatedAt: true,
} as const satisfies Prisma.RoomSelect;

export async function findManyRooms(where?: Prisma.RoomWhereInput, tx: Prisma.TransactionClient = prisma) {
  const rooms = await tx.room.findMany({
    where,
    select: ROOM_SELECT,
  });

  return flattenRoom(rooms);
}

export async function findFirstRoom(where?: Prisma.RoomWhereInput, tx: Prisma.TransactionClient = prisma) {
  const room = await tx.room.findFirst({
    where,
    select: ROOM_SELECT,
  });

  return flattenRoom(room ? [room] : [])[0];
}

export async function deleteManyRooms(where?: Prisma.RoomWhereInput, tx: Prisma.TransactionClient = prisma) {
  return tx.room.deleteMany({
    where,
  });
}

export async function upsertRoom(
  params: {
    where: Prisma.RoomWhereUniqueInput;
    create: Prisma.RoomCreateInput;
    update: Prisma.RoomUpdateInput;
  },
  tx: Prisma.TransactionClient = prisma,
) {
  const room = await tx.room.upsert({
    where: params.where,
    create: params.create,
    update: params.update,
    select: ROOM_SELECT,
  });

  return flattenRoom(room);
}

type RoomWithRelations = Prisma.RoomGetPayload<{ select: typeof ROOM_SELECT }>;

function flattenRoom(room: RoomWithRelations): IRoom;
function flattenRoom(rooms: RoomWithRelations[]): IRoom[];

function flattenRoom(data: RoomWithRelations | RoomWithRelations[]): IRoom | IRoom[] {
  const isArray = Array.isArray(data);
  const rooms = isArray ? data : [data];

  const mapped = rooms.map((room) => {
    return {
      roomId: room.roomId,
      name: room.name,
      color: room.color,
      icon: room.icon,
      publicFacing: room.publicFacing,
      roomCategoryId: room.roomCategoryId,
      roomCategory: {
        roomCategoryId: room.roomCategoryId,
        name: room.roomCategory.name,
        createdAt: room.roomCategory.createdAt,
        updatedAt: room.roomCategory.updatedAt,
      },
      roomProperty: room.roomProperty.map((roomProperty) => {
        return {
          roomPropertyId: roomProperty.roomPropertyId,
          propertyId: roomProperty.property.propertyId,
          name: roomProperty.property.name,
          value: roomProperty.value ?? "",
          type: roomProperty.property.type,
          createdAt: roomProperty.createdAt,
          updatedAt: roomProperty.updatedAt,
        };
      }),
      roomRoles: room.roomRoles.map((roomRoles) => {
        return {
          ...roomRoles,
        };
      }),
      createdAt: room.createdAt,
      updatedAt: room.updatedAt,
    };
  });

  return isArray ? mapped : mapped[0];
}
