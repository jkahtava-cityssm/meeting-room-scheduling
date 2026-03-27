import { prisma } from "@/prisma";
import type { Prisma } from "@prisma/client";
import { IRoom, SRoom } from "../schemas";
import z from "zod/v4";

// Standard room select configuration — used across all DAL functions
const ROOM_SELECT = {
  roomId: true,
  name: true,
  color: true,
  icon: true,
  publicFacing: true,
  displayOrder: true,
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
    orderBy: [{ displayOrder: { sort: "asc", nulls: "last" } }, { roomId: "asc" }],
  });

  return flattenRoom(rooms);
}

export async function findFirstRoom(where?: Prisma.RoomWhereInput, tx: Prisma.TransactionClient = prisma) {
  const room = await tx.room.findFirst({
    where,
    select: ROOM_SELECT,
    orderBy: [{ displayOrder: { sort: "asc", nulls: "last" } }, { roomId: "asc" }],
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

export async function createRoom(create: Prisma.RoomCreateInput, tx: Prisma.TransactionClient = prisma) {
  const room = await tx.room.create({
    data: create,
    select: ROOM_SELECT,
  });

  return flattenRoom(room);
}

type RoomWithRelations = Prisma.RoomGetPayload<{ select: typeof ROOM_SELECT }>;
type IRoomInput = z.input<typeof SRoom>;

function flattenRoom(room: RoomWithRelations): IRoomInput;
function flattenRoom(rooms: RoomWithRelations[]): IRoomInput[];

function flattenRoom(data: RoomWithRelations | RoomWithRelations[]): IRoomInput | IRoomInput[] {
  const isArray = Array.isArray(data);
  const rooms = isArray ? data : [data];

  const mapped = rooms.map((room) => {
    return {
      ...room,
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
