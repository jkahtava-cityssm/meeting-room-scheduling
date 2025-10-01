import { prisma } from "@/prisma";

import { NextRequest, NextResponse } from "next/server";

import { UTCDate } from "@date-fns/utc";

import { BadRequestMessage, CreatedMessage, InternalServerErrorMessage, SuccessMessage } from "@/lib/api-helpers";

export async function POST(req: Request) {
  if (!process.env.DATABASE_URL) {
    return InternalServerErrorMessage("DATABASE_URL Missing");
  }

  const { title, description, startDate, endDate, roomId, rule, ruleStartDate, ruleEndDate } = await req.json();

  if (!title || (!description && description !== "") || !startDate || !endDate || !roomId) {
    return BadRequestMessage();
  }

  let recurrence = null;

  if (rule) {
    recurrence = await prisma.recurrence.create({
      data: { rule, startDate: ruleStartDate, endDate: ruleEndDate },
    });
  }

  const event = await prisma.event.create({
    data: { title, description, startDate, endDate, roomId, recurrenceId: recurrence?.recurrenceId },
    include: { room: true, recurrence: true },
  });

  if (!event) {
    InternalServerErrorMessage();
  }

  return CreatedMessage("Created Event", event);
}

export async function PUT(req: Request) {
  if (!process.env.DATABASE_URL) {
    return InternalServerErrorMessage("DATABASE_URL Missing");
  }

  /*const { eventId, title, description, startDate, endDate, roomId, recurrenceId, rule, ruleStartDate, ruleEndDate } =
    await req.json();*/

  const { eventData, ruleData } = await req.json();

  if (!eventData) {
    return BadRequestMessage();
  }

  if (
    eventData.title === undefined ||
    eventData.startDate === undefined ||
    eventData.endDate === undefined ||
    eventData.roomId === undefined ||
    eventData.memberId === undefined
  ) {
    return BadRequestMessage();
  }

  if (
    ruleData &&
    (ruleData.rule === undefined || ruleData.ruleStartDate === undefined || ruleData.ruleEndDate === undefined)
  ) {
    return BadRequestMessage();
  }
  const { eventId, title, description, startDate, endDate, roomId, recurrenceId, memberId } = eventData;
  const { rule, ruleStartDate, ruleEndDate } = ruleData || {};

  let recurrence = null;

  if (rule) {
    recurrence = await prisma.recurrence.upsert({
      create: { rule, startDate: ruleStartDate, endDate: ruleEndDate },
      where: { recurrenceId: recurrenceId },
      update: { rule, startDate: ruleStartDate, endDate: ruleEndDate },
    });
  }

  if (ruleData === null && recurrenceId !== null) {
    // Delete recurrence if ruleData is null and recurrenceId exists
    await prisma.recurrence.delete({
      where: { recurrenceId: recurrenceId },
    });
  }

  const event = await prisma.event.upsert({
    create: {
      title,
      description,
      startDate,
      endDate,
      roomId,
      recurrenceId: recurrence ? recurrence.recurrenceId : null,
      statusId: 1,
      memberId,
    },
    where: { eventId: eventId },
    update: {
      title,
      description,
      startDate,
      endDate,
      roomId,
      recurrenceId: recurrence ? recurrence.recurrenceId : null,
      statusId: 1,
      memberId,
    },
    include: { room: true, recurrence: true },
  });

  if (!event) {
    InternalServerErrorMessage();
  }

  if (event.eventId === eventId) {
    return SuccessMessage("Updated Event", event);
  }

  return CreatedMessage("Created Event", event);
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

  const StartDate: UTCDate = new UTCDate(startDateParam);
  const EndDate: UTCDate = new UTCDate(endDateParam);

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
