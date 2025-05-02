import { prisma } from "@/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  if (!process.env.DATABASE_URL) {
    return NextResponse.json({ error: "DATABASE_URL is not set" }, { status: 500 });
  }

  const rooms = await prisma.room.findMany({});

  if (!rooms) {
    return NextResponse.json({ error: "Failed to fetch Events" }, { status: 500 });
  }

  return NextResponse.json(rooms);
}
