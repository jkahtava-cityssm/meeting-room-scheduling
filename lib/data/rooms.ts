import { prisma } from "@/prisma";
import type { Prisma } from "@prisma/client";

// Standard room select configuration — used across all DAL functions
const ROOM_SELECT = {
  roomId: true,
  name: true,
  color: true,
  icon: true,
  roomScopeId: true,
  roomScope: { select: { roomScopeId: true, name: true, createdAt: true, updatedAt: true, accessLevel: true } },
  roomCategoryId: true,
  roomCategory: { select: { roomCategoryId: true, name: true, createdAt: true, updatedAt: true } },
  roomProperty: true,
  createdAt: true,
  updatedAt: true,
} as const satisfies Prisma.RoomSelect;

export async function findManyRooms(where?: Prisma.RoomWhereInput) {
  return prisma.room.findMany({
    where,
    select: ROOM_SELECT,
  });
}
