import { IEvent } from "@/lib/schemas/calendar";

import { prisma } from "@/prisma";

import { NextRequest, NextResponse } from "next/server";

import { UTCDate } from "@date-fns/utc";

import { BadRequestMessage, CreatedMessage, InternalServerErrorMessage, SuccessMessage } from "../lib/status-codes";
import { generateMultiDayEventsInPeriod, generateRecurringEventsInPeriod } from "../lib/event-helpers";

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
    eventData.roomId === undefined
  ) {
    return BadRequestMessage();
  }

  if (
    ruleData &&
    (ruleData.rule === undefined || ruleData.ruleStartDate === undefined || ruleData.ruleEndDate === undefined)
  ) {
    return BadRequestMessage();
  }
  const { eventId, title, description, startDate, endDate, roomId, recurrenceId } = eventData;
  const { rule, ruleStartDate, ruleEndDate } = ruleData || {};

  let recurrence = null;

  if (rule) {
    recurrence = await prisma.recurrence.upsert({
      create: { rule, startDate: ruleStartDate, endDate: ruleEndDate },
      where: { recurrenceId: recurrenceId },
      update: { rule, startDate: ruleStartDate, endDate: ruleEndDate },
    });
  }

  const event = await prisma.event.upsert({
    create: { title, description, startDate, endDate, roomId, recurrenceId: recurrence?.recurrenceId },
    where: { eventId: eventId },
    update: { title, description, startDate, endDate, roomId, recurrenceId: recurrence?.recurrenceId },
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

  //Collect the Recurring Events first, since a Recurring Event can also be a Multi Day event that happens many times.
  //This probably needs to be adjusted a bit.
  const recurringEvents = generateRecurringEventsInPeriod(events, StartDate, EndDate);
  //const multiRecurringEvents = generateMultiDayEventsInPeriod(recurringEvents, StartDate, EndDate);
  const multiDayEvents = generateMultiDayEventsInPeriod(events, StartDate, EndDate, { from: 0, to: 24 });

  const combinedEvents: IEvent[] = [...recurringEvents, ...multiDayEvents];
  //console.log(multiDayEvents);
  if (!events) {
    return InternalServerErrorMessage();
  }

  return NextResponse.json(combinedEvents);
}
