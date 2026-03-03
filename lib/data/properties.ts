import { prisma } from "@/prisma";
import { Prisma } from "@prisma/client";

const ROOM_PROPERTY_SELECT = {
  roomPropertyId: true,
  name: true,
  createdAt: true,
  updatedAt: true,
} as Prisma.RoomPropertySelect;

export async function findManyRoomProperties(
  where?: Prisma.RoomPropertyWhereInput,
  tx: Prisma.TransactionClient = prisma,
) {
  return tx.roomProperty.findMany({
    where,
    select: ROOM_PROPERTY_SELECT,
  });
}
