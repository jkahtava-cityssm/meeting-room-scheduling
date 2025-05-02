import { prisma } from "@/prisma";
import { unstable_cache } from "next/cache";
import { NextRequest, NextResponse } from "next/server";

const getRooms = unstable_cache(
  async () => {
    return await prisma.room.findMany({});
  },
  ["rooms"],
  { revalidate: 3600, tags: ["rooms"] }
);

export async function GET(req: NextRequest) {
  if (!process.env.DATABASE_URL) {
    return NextResponse.json({ error: "DATABASE_URL is not set" }, { status: 500 });
  }

  const rooms = await getRooms();

  if (!rooms) {
    return NextResponse.json({ error: "Failed to fetch Events" }, { status: 500 });
  }

  return NextResponse.json(rooms);
}
