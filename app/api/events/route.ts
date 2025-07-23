import { IEvent } from "@/lib/schemas/calendar";
import { TVisibleHours } from "@/lib/types";
import { prisma } from "@/prisma";
import { addDays, differenceInDays, endOfDay, isWithinInterval, parseISO, set, startOfDay } from "date-fns";

import { NextRequest, NextResponse } from "next/server";
import { rrulestr } from "rrule";
import { UTCDate } from "@date-fns/utc";

async function CreatedMessage(data: object) {
  return NextResponse.json({ message: "Created Event", data: data }, { status: 201 });
}

async function UpdatedMessage(data: object) {
  return NextResponse.json({ message: "Updated Event", data: data }, { status: 200 });
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

  return CreatedMessage(event);
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

  //Collect the Recurring Events first, since a Recurring Event can also be a Multi Day event that happens many times.
  //This probably needs to be adjusted a bit.
  //const recurringEvents = generateRecurringEventsInPeriod([event], StartDate, EndDate);
  //const multiRecurringEvents = generateMultiDayEventsInPeriod(recurringEvents, StartDate, EndDate);
  //const multiDayEvents = generateMultiDayEventsInPeriod([event], StartDate, EndDate, { from: 0, to: 24 });

  //const combinedEvents: IEvent[] = [...recurringEvents, ...multiDayEvents];

  if (event.eventId === eventId) {
    return UpdatedMessage(event);
  }

  return CreatedMessage(event);
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

export function generateRecurringEventsInPeriod(events: IEvent[], periodStart: UTCDate, periodEnd: UTCDate) {
  const eventList: IEvent[] = [];

  events.forEach((element) => {
    if (element.recurrenceId === null) {
      return;
    }

    const currentRule = element.recurrence?.rule as string;

    const rrule = rrulestr(currentRule, { cache: true });
    const recurrenceArray = rrule.between(periodStart, periodEnd);

    for (let index = 0; index < recurrenceArray.length; index++) {
      const newEvent = { ...element };
      const recurringDate = setUTCPartsToDate(recurrenceArray[index]);
      newEvent.title = "Series - " + newEvent.title;
      newEvent.startDate = set(newEvent.startDate, {
        year: recurringDate.getFullYear(),
        month: recurringDate.getMonth(),
        date: recurringDate.getDate(),
      });
      newEvent.endDate = set(newEvent.endDate, {
        year: recurringDate.getFullYear(),
        month: recurringDate.getMonth(),
        date: recurringDate.getDate(),
      });

      eventList.push(newEvent);
    }
  });
  return eventList;
}

export function generateMultiDayEventsInPeriod(
  events: IEvent[],
  periodStart: Date,
  periodEnd: Date,
  visibleHours: TVisibleHours
) {
  const minStartTime = visibleHours.from;
  const maxEndTime = visibleHours.to;

  const eventList: IEvent[] = [];

  events.forEach((element) => {
    if (element.recurrenceId !== null) {
      return;
    }
    const currentStartDate = element.startDate;
    const currentEndDate = element.endDate;

    const totalDaysBetween = differenceInDays(endOfDay(currentEndDate), startOfDay(currentStartDate));
    //const totalDaysBetween = differenceInDays(currentEndDate, currentStartDate);

    if (totalDaysBetween === 0) {
      eventList.push(element);
      return;
    }

    for (let index = 0; index <= totalDaysBetween; index++) {
      const newEvent = { ...element, eventIsSplit: true };

      const newDay = set(addDays(currentStartDate, index), { hours: 0, minutes: 0, seconds: 0, milliseconds: 0 });

      if (!isWithinInterval(newDay, { start: periodStart, end: periodEnd })) {
        continue;
      }

      if (index === 0) {
        //First Day
        newEvent.title = "Day " + (index + 1) + " of " + (totalDaysBetween + 1) + " - " + newEvent.title;
        newEvent.endDate = set(currentStartDate, { hours: maxEndTime, minutes: 0, seconds: 0, milliseconds: 0 });
        newEvent.multiDay = { position: "first" };
      } else if (index === totalDaysBetween) {
        //LAST DAY
        newEvent.title = "Day " + (index + 1) + " of " + (totalDaysBetween + 1) + " - " + newEvent.title;
        newEvent.startDate = set(currentEndDate, { hours: minStartTime, minutes: 0, seconds: 0, milliseconds: 0 });
        newEvent.multiDay = { position: "last" };
      } else {
        newEvent.title = "Day " + (index + 1) + " of " + (totalDaysBetween + 1) + " - " + newEvent.title;

        newEvent.startDate = set(newDay, { hours: minStartTime, minutes: 0, seconds: 0, milliseconds: 0 });
        newEvent.endDate = set(newDay, { hours: maxEndTime, minutes: 0, seconds: 0, milliseconds: 0 });
        newEvent.multiDay = { position: "middle" };
        //MIDDLE DAY
      }
      eventList.push(newEvent);
    }
  });

  return eventList;
}

function setPartsToUTCDate(d: Date) {
  return new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate(), d.getHours(), d.getMinutes(), d.getSeconds()));
}

function setUTCPartsToDate(d: Date) {
  return new Date(
    d.getUTCFullYear(),
    d.getUTCMonth(),
    d.getUTCDate(),
    d.getUTCHours(),
    d.getUTCMinutes(),
    d.getUTCSeconds()
  );
}
