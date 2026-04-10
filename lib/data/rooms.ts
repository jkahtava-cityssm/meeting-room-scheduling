import { prisma } from '@/prisma';
import type { Prisma } from '@prisma/client';
import { IRoom, SRoom } from '../schemas';
import z from 'zod/v4';

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
    orderBy: [{ displayOrder: { sort: 'asc', nulls: 'last' } }, { roomId: 'asc' }],
  });

  return flattenRoom(rooms);
}

export async function findFirstRoom(where?: Prisma.RoomWhereInput, tx: Prisma.TransactionClient = prisma) {
  const room = await tx.room.findFirst({
    where,
    select: ROOM_SELECT,
    orderBy: [{ displayOrder: { sort: 'asc', nulls: 'last' } }, { roomId: 'asc' }],
  });

  return flattenRoom(room ? [room] : [])[0];
}

export async function deleteManyRooms(where?: Prisma.RoomWhereInput, tx: Prisma.TransactionClient = prisma) {
  return tx.room.deleteMany({
    where,
  });
}

export async function upsertRoom(
  data: { roomId?: number; name: string; color: string; icon: string; publicFacing: boolean; displayOrder?: number; roomCategoryId: number },
  sessionUserId: number,
  tx: Prisma.TransactionClient = prisma,
) {
  const room = await tx.room.upsert({
    where: { roomId: data.roomId },
    create: {
      name: data.name,
      color: data.color,
      icon: data.icon,
      publicFacing: data.publicFacing,
      displayOrder: data.displayOrder,
      roomCategory: { connect: { roomCategoryId: data.roomCategoryId } },
      createdByUser: { connect: { id: sessionUserId } },
      updatedByUser: { connect: { id: sessionUserId } },
    },
    update: {
      name: data.name,
      color: data.color,
      icon: data.icon,
      publicFacing: data.publicFacing,
      displayOrder: data.displayOrder,
      roomCategory: { connect: { roomCategoryId: data.roomCategoryId } },
      updatedByUser: { connect: { id: sessionUserId } },
    },
    select: ROOM_SELECT,
  });

  return flattenRoom(room);
}

export async function createRoom(
  create: Omit<Prisma.RoomCreateInput, 'createdBy' | 'updatedBy' | 'createdByUser' | 'updatedByUser'>,
  sessionUserId: number,
  tx: Prisma.TransactionClient = prisma,
) {
  const room = await tx.room.create({
    data: { ...create, createdByUser: { connect: { id: sessionUserId } }, updatedByUser: { connect: { id: sessionUserId } } },
    select: ROOM_SELECT,
  });

  return flattenRoom(room);
}

export async function createManyRoomRole(
  create: Omit<Prisma.RoomRoleCreateManyInput, 'createdBy' | 'updatedBy' | 'createdByUser' | 'updatedByUser'>[],
  sessionUserId: number,
  tx: Prisma.TransactionClient = prisma,
) {
  return await tx.roomRole.createMany({
    data: create.map((roomRole) => {
      return { ...roomRole, createdBy: sessionUserId, updatedBy: sessionUserId };
    }),
    skipDuplicates: true,
  });
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
          value: roomProperty.value ?? '',
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

export async function upsertRoomProperty(
  roomId: number,
  propertyId: number,
  value: string,
  sessionUserId: number,
  tx: Prisma.TransactionClient = prisma,
) {
  const roomProperty = await tx.roomProperty.upsert({
    where: { roomId_propertyId: { roomId, propertyId } },
    create: {
      roomId,
      propertyId,
      //room: { connect: { roomId } },
      value,
      createdBy: sessionUserId,
      updatedBy: sessionUserId,
      //property: { connect: { propertyId: propertyId } },
      //createdByUser: { connect: { id: sessionUserId } },
      //updatedByUser: { connect: { id: sessionUserId } },
    },
    update: {
      value,
      updatedBy: sessionUserId,
      // updatedByUser: { connect: { id: sessionUserId } },
    },
  });

  return roomProperty;
}

export async function createRoomProperty(create: Prisma.RoomPropertyCreateInput, sessionUserId: number, tx: Prisma.TransactionClient = prisma) {
  const roomProperty = await tx.roomProperty.create({
    data: { ...create, createdByUser: { connect: { id: sessionUserId } }, updatedByUser: { connect: { id: sessionUserId } } },
  });

  return roomProperty;
}
