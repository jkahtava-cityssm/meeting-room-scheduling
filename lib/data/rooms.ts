import { prisma } from "@/prisma";
import type { Prisma } from "@prisma/client";

export async function findManyRooms(where?: Prisma.RoomWhereInput) {
  return prisma.room.findMany({
    where,
    select: {
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
    },
  });
}
