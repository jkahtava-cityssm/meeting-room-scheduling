import { prisma } from '@/prisma';
import { Prisma } from '@prisma/client';
import { SRoom } from '../schemas';
import z from 'zod/v4';
import { safeCreateMany } from '../api-helpers';

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
  data: {
    roomId?: number;
    name: string;
    color: string;
    icon: string;
    publicFacing: boolean;
    displayOrder?: number;
    roomCategoryId: number;
  },
  sessionUserId: number,
  tx: Prisma.TransactionClient = prisma,
) {
  const contextInfo = `[RoomId: ${data.roomId ?? 'NEW'}, Name: ${data.name}, User: ${sessionUserId}]`;

  // Shared payload for data mutations
  const sharedData = {
    name: data.name,
    color: data.color,
    icon: data.icon,
    publicFacing: data.publicFacing,
    displayOrder: data.displayOrder,
    roomCategory: { connect: { roomCategoryId: data.roomCategoryId } },
    updatedByUser: { connect: { id: sessionUserId } },
  };

  // Scenario A: No roomId provided means it is explicitly a brand new record
  if (!data.roomId) {
    try {
      const room = await tx.room.create({
        data: {
          ...sharedData,
          createdByUser: { connect: { id: sessionUserId } },
        },
        select: ROOM_SELECT,
      });
      return flattenRoom(room);
    } catch (err) {
      console.error(`[Room] Failed to create new room ${contextInfo}:`, err);
      throw new Error(`Database error encountered while creating new room`, { cause: err });
    }
  }

  // Scenario B: RoomId exists, perform the concurrency-safe update-first strategy
  try {
    // Optimistically assume the record exists and try to update it
    const room = await tx.room.update({
      where: { roomId: data.roomId },
      data: sharedData,
      select: ROOM_SELECT,
    });
    return flattenRoom(room);
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      // P2025: Record to update not found (it doesn't exist yet, so create it)
      if (err.code === 'P2025') {
        try {
          const room = await tx.room.create({
            data: {
              ...sharedData,
              createdByUser: { connect: { id: sessionUserId } },
            },
            select: ROOM_SELECT,
          });
          return flattenRoom(room);
        } catch (createErr) {
          console.error(`[Room] Concurrency fallback create failed for ${contextInfo}:`, createErr);
          throw new Error(`Failed to create room after missing update check`, { cause: createErr });
        }
      }

      console.error(`[Room] Database error during update ${contextInfo}:`, err);
      throw new Error(`Database error while updating room data (Prisma code: ${err.code})`, { cause: err });
    }

    // Handle unexpected/generic errors
    console.error(`[Room] Unexpected error during upsertRoom ${contextInfo}:`, err);
    throw new Error(`An unexpected error occurred while saving room configurations`, { cause: err });
  }
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
  const data: Prisma.RoomRoleCreateManyInput[] = create.map((roomRole) => ({
    ...roomRole,
    createdBy: sessionUserId,
    updatedBy: sessionUserId,
  }));

  return await safeCreateMany(tx.roomRole, data, ['roomId', 'roleId'], tx);
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
  const contextInfo = `[RoomId: ${roomId}, PropertyId: ${propertyId}, User: ${sessionUserId}]`;

  try {
    // 1. Optimistically try to create the room property link first
    return await tx.roomProperty.create({
      data: {
        roomId,
        propertyId,
        value,
        createdBy: sessionUserId,
        updatedBy: sessionUserId,
      },
    });
  } catch (err) {
    // 2. Handle known database errors
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      if (err.code === 'P2002') {
        try {
          // 3. Conflict found (already exists), fall back to update using the compound key
          return await tx.roomProperty.update({
            where: {
              roomId_propertyId: {
                roomId,
                propertyId,
              },
            },
            data: {
              value,
              updatedBy: sessionUserId,
            },
          });
        } catch (updateErr) {
          console.error(`[RoomProperty] Concurrency fallback update failed for ${contextInfo}:`, updateErr);
          throw new Error(`Failed to update existing room property for ${contextInfo}`, { cause: updateErr });
        }
      }

      console.error(`[RoomProperty] Database error during initial create ${contextInfo}:`, err);
      throw new Error(`Database error while saving room property (Prisma code: ${err.code})`, { cause: err });
    }

    // 4. Handle unexpected/generic errors
    console.error(`[RoomProperty] Unexpected error during upsertRoomProperty ${contextInfo}:`, err);
    throw new Error(`An unexpected error occurred while saving room property configurations`, { cause: err });
  }
}

export async function createRoomProperty(create: Prisma.RoomPropertyCreateInput, sessionUserId: number, tx: Prisma.TransactionClient = prisma) {
  const roomProperty = await tx.roomProperty.create({
    data: { ...create, createdByUser: { connect: { id: sessionUserId } }, updatedByUser: { connect: { id: sessionUserId } } },
  });

  return roomProperty;
}
