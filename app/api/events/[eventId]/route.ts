import { prisma } from "@/prisma";
import { NextResponse } from "next/server";

export async function GET(request: Request, { params }: { params: Promise<{ eventId: string }> }) {
  const { eventId } = await params;

  const events = await prisma.event.findMany({
    include: { room: true },
    where: { eventId: parseInt(eventId) },
  });

  if (!events) {
    return NextResponse.json({ error: "Failed to fetch Events" }, { status: 500 });
  }

  return NextResponse.json(events);
}
