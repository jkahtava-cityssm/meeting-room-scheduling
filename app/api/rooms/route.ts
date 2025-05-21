import { prisma } from "@/prisma";
import { unstable_cache } from "next/cache";
import { NextRequest, NextResponse } from "next/server";
/*
const getRooms = unstable_cache(
  async () => {
    return await prisma.room.findMany({});
  },
  ["rooms"],
  { revalidate: 30, tags: ["rooms"] }
);
*/

async function CreatedMessage() {
  return NextResponse.json({ message: "Created Event" }, { status: 201 });
}

async function UpdatedMessage() {
  return NextResponse.json({ message: "Updated Event" }, { status: 200 });
}

async function InternalServerErrorMessage(details?: string) {
  return NextResponse.json({ error: "Internal Server Error" + details && ": " + details }, { status: 500 });
}

async function BadRequestMessage() {
  return NextResponse.json({ error: "Bad Request" }, { status: 400 });
}

export async function GET(req: NextRequest) {
  if (!process.env.DATABASE_URL) {
    return NextResponse.json({ error: "DATABASE_URL is not set" }, { status: 500 });
  }

  const rooms = await prisma.room.findMany({});

  if (!rooms) {
    return InternalServerErrorMessage();
  }

  return NextResponse.json(rooms);
}
