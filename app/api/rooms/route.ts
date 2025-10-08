import { BadRequestMessage, InternalServerErrorMessage, SuccessMessage } from "@/lib/api-helpers";
import { getServerSession, hasServerPermission } from "@/lib/auth";
import { prisma } from "@/prisma";
import { unstable_cache } from "next/cache";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  if (!process.env.DATABASE_URL) {
    return InternalServerErrorMessage("DATABASE_URL Missing");
  }

  const session = await getServerSession();

  if (!session || !hasServerPermission(session, "Room", "Read")) {
    return BadRequestMessage("Not Authorized");
  }

  const rooms = await prisma.room.findMany();

  if (!rooms) {
    return InternalServerErrorMessage();
  }

  return SuccessMessage("Collected Rooms", rooms);
}
