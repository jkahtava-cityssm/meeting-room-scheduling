import { prisma } from "@/prisma";

import { NextRequest } from "next/server";
import { BadRequestMessage, InternalServerErrorMessage, SuccessMessage } from "@/lib/api-helpers";
import { UTCDate } from "@date-fns/utc";

export async function GET(req: NextRequest) {
  const rooms = await prisma.room.findMany({
    select: {
      roomId: true,
      name: true,
      color: true,
      roomCategory: { select: { roomCategoryId: true, name: true } },
      RoomProperty: { select: { name: true, value: true } },
    },
    where: { roomScope: { name: "Public" } },
  });

  if (!rooms) {
    return InternalServerErrorMessage();
  }

  return SuccessMessage("Collected Rooms", rooms);
}
