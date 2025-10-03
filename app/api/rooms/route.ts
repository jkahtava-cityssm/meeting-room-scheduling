import { InternalServerErrorMessage, SuccessMessage } from "@/lib/api-helpers";
import { prisma } from "@/prisma";
import { unstable_cache } from "next/cache";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  if (!process.env.DATABASE_URL) {
    return NextResponse.json({ error: "DATABASE_URL is not set" }, { status: 500 });
  }

  const rooms = await prisma.room.findMany({});

  if (!rooms) {
    return InternalServerErrorMessage();
  }

  return SuccessMessage("Collected Rooms", rooms);
}
