import { prisma } from "@/prisma";
import type { Prisma } from "@prisma/client";

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
  roomProperty: { select: { roomPropertyId: true, name: true, value: true, createdAt: true, updatedAt: true } },
  createdAt: true,
  updatedAt: true,
} as const satisfies Prisma.RoomSelect;

export async function findManyRooms(where?: Prisma.RoomWhereInput, tx: Prisma.TransactionClient = prisma) {
  return tx.room.findMany({
    where,
    select: ROOM_SELECT,
  });
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
  return tx.room.upsert({
    where: params.where,
    create: params.create,
    update: params.update,
    select: ROOM_SELECT,
  });
}
