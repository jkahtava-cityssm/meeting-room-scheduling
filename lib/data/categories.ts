import { prisma } from "@/prisma";
import { Prisma } from "@prisma/client";

const ROOM_CATEGORY_SELECT = {
  roomCategoryId: true,
  name: true,
  createdAt: true,
  updatedAt: true,
} as Prisma.RoomCategorySelect;

export async function findManyRoomCategories(
  where?: Prisma.RoomCategoryWhereInput,
  tx: Prisma.TransactionClient = prisma,
) {
  return tx.roomCategory.findMany({
    where,
    select: ROOM_CATEGORY_SELECT,
    orderBy: { roomCategoryId: "asc" },
  });
}
