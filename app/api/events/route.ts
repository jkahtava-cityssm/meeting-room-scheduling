import { prisma } from "@/prisma";
import { endOfYear, formatDate, parseISO, startOfYear } from "date-fns";
import { Star } from "lucide-react";
import { revalidatePath, revalidateTag } from "next/cache";
import { NextRequest, NextResponse } from "next/server";
import { start } from "repl";

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

export async function POST(req: Request) {
  if (!process.env.DATABASE_URL) {
    return InternalServerErrorMessage("DATABASE_URL Missing");
  }

  const { title, description, startDate, endDate, roomId } = await req.json();

  if (!title || !description || !startDate || !endDate || !roomId) {
    return BadRequestMessage();
  }

  const result = await prisma.event.create({
    data: { title, description, startDate, endDate, roomId },
  });

  if (!result) {
    InternalServerErrorMessage();
  }

  return CreatedMessage();
}

export async function PUT(req: Request) {
  if (!process.env.DATABASE_URL) {
    return InternalServerErrorMessage("DATABASE_URL Missing");
  }

  const { eventId, title, description, startDate, endDate, roomId } = await req.json();

  if (!title || !description || !startDate || !endDate || !roomId) {
    return BadRequestMessage();
  }

  const result = await prisma.event.upsert({
    create: { title, description, startDate, endDate, roomId },
    where: { eventId: eventId },
    update: { title, description, startDate, endDate, roomId },
  });

  if (!result) {
    InternalServerErrorMessage();
  }

  revalidateTag("EventsUpdated");
  //revalidatePath("/private/calendar/month-view");

  if (result.eventId === eventId) {
    return UpdatedMessage();
  }

  return CreatedMessage();
}

export async function GET(req: NextRequest) {
  if (!process.env.DATABASE_URL) {
    return InternalServerErrorMessage("DATABASE_URL Missing");
  }
  const searchParams = req.nextUrl.searchParams;

  const startDateParam = searchParams.get("startdate");
  const endDateParam = searchParams.get("enddate");

  if (!startDateParam || !endDateParam) {
    return BadRequestMessage();
  }

  const StartDate: Date = parseISO(startDateParam);
  const EndDate: Date = parseISO(endDateParam);

  const events = await prisma.event.findMany({
    include: { room: true, recurrence: true },
    where: {
      OR: [
        { startDate: { lte: EndDate }, endDate: { gte: StartDate } },
        { recurrence: { startDate: { lte: EndDate }, endDate: { gte: StartDate } } },
      ],
    },
  });

  if (!events) {
    return InternalServerErrorMessage();
  }

  return NextResponse.json(events);
}
