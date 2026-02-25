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

export async function findManyRooms(where?: Prisma.RoomWhereInput) {
  return prisma.room.findMany({
    where,
    select: ROOM_SELECT,
  });
}
