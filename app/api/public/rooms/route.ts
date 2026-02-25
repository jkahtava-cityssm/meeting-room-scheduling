import { prisma } from "@/prisma";

import { NextRequest } from "next/server";
import { BadRequestMessage, InternalServerErrorMessage, SuccessMessage, UnauthorizedMessage } from "@/lib/api-helpers";
import { UTCDate } from "@date-fns/utc";
import { findPublicRooms } from "@/lib/data/public";
import { verifySecretHeader } from "@/lib/server/verifySecretHeader";

export async function GET(request: NextRequest) {
  if (!verifySecretHeader(request)) {
    return UnauthorizedMessage();
  }

  const rooms = await findPublicRooms({ publicFacing: true });

  if (!rooms) {
    return InternalServerErrorMessage();
  }

  return SuccessMessage("Collected Rooms", rooms);
}
