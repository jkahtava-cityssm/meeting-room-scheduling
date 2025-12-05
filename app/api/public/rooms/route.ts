import { prisma } from "@/prisma";
import { findManyRooms } from "@/lib/data/rooms";

import { NextRequest } from "next/server";
import { BadRequestMessage, InternalServerErrorMessage, SuccessMessage } from "@/lib/api-helpers";
import { UTCDate } from "@date-fns/utc";

export async function GET(req: NextRequest) {
  const rooms = await findManyRooms({ roomScope: { name: "Public" } });

  if (!rooms) {
    return InternalServerErrorMessage();
  }

  return SuccessMessage("Collected Rooms", rooms);
}
