import { prisma } from "@/prisma";
import { endOfYear, formatDate, parseISO, startOfYear } from "date-fns";
import { Star } from "lucide-react";
import { NextRequest, NextResponse } from "next/server";
import { start } from "repl";

export async function POST(req: Request) {
  if (!process.env.DATABASE_URL) {
    return NextResponse.json({ error: "DATABASE_URL is not set" }, { status: 500 });
  }

  const { title, description, startDate, endDate, roomId } = await req.json();

  await prisma.event.create({
    data: { title, description, startDate, endDate, roomId },
  });

  return NextResponse.json({ message: "Created Event" }, { status: 200 });
}

export async function GET(req: NextRequest) {
  if (!process.env.DATABASE_URL) {
    return NextResponse.json({ error: "DATABASE_URL is not set" }, { status: 500 });
  }

  const searchParams = req.nextUrl.searchParams;

  const startDateParam = searchParams.get("startdate");
  const endDateParam = searchParams.get("enddate");

  if (!startDateParam || !endDateParam) {
    return NextResponse.json({ error: "Failed to fetch Events, insufficient parameters provided" }, { status: 500 });
  }

  const StartDate: Date = parseISO(startDateParam);
  const EndDate: Date = parseISO(endDateParam);

  const events = await prisma.event.findMany({
    include: { room: true },
    where: { OR: [{ startDate: { lte: EndDate }, endDate: { gte: StartDate } }] },
  });

  if (!events) {
    return NextResponse.json({ error: "Failed to fetch Events" }, { status: 500 });
  }

  return NextResponse.json(events);
}
