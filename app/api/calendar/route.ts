import { IEvent } from "@/lib/schemas/calendar";
import { prisma } from "@/prisma";
import { addDays, differenceInDays, endOfDay, isWithinInterval, parseISO, set, startOfDay } from "date-fns";

import { NextRequest, NextResponse } from "next/server";

import { rrulestr } from "rrule";

async function InternalServerErrorMessage(details?: string) {
  return NextResponse.json({ error: "Internal Server Error" + details && ": " + details }, { status: 500 });
}

async function BadRequestMessage() {
  return NextResponse.json({ error: "Bad Request" }, { status: 400 });
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
      startDate: { lte: EndDate },
      endDate: { gte: StartDate },
    },
  });

  const recurrence = await prisma.event.findMany({
    include: { room: true, recurrence: true },
    where: {
      recurrence: { startDate: { lte: EndDate }, endDate: { gte: StartDate } },
    },
  });

  //Collect the Recurring Events first, since a Recurring Event can also be a Multi Day event that happens many times.
  //This probably needs to be adjusted a bit.
  const recurringEvents = generateRecurringEventsInPeriod(recurrence, StartDate, EndDate);
  //const multiRecurringEvents = generateMultiDayEventsInPeriod(recurringEvents, StartDate, EndDate);
  const multiDayEvents = generateMultiDayEventsInPeriod(events, StartDate, EndDate);

  const combinedEvents: IEvent[] = [...recurringEvents, ...multiDayEvents];

  if (!events) {
    return InternalServerErrorMessage();
  }

  return NextResponse.json(combinedEvents);
}

function generateRecurringEventsInPeriod(events: IEvent[], periodStart: Date, periodEnd: Date) {
  const eventList: IEvent[] = [];

  events.forEach((element) => {
    if (element.recurrenceId == null) {
      return;
    }

    const currentRule = element.recurrence?.rule as string;

    const rrule = rrulestr(currentRule);
    const recurrenceArray = rrule.between(setPartsToUTCDate(periodStart), setPartsToUTCDate(periodEnd));

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

function generateMultiDayEventsInPeriod(events: IEvent[], periodStart: Date, periodEnd: Date) {
  const minStartTime = 0;
  const maxEndTime = 24;

  const eventList: IEvent[] = [];

  events.forEach((element) => {
    const currentStartDate = element.startDate;
    const currentEndDate = element.endDate;

    const totalDaysBetween = differenceInDays(endOfDay(currentEndDate), startOfDay(currentStartDate));
    //const totalDaysBetween = differenceInDays(currentEndDate, currentStartDate);

    if (totalDaysBetween === 0) {
      eventList.push(element);
      return;
    }
    //Dont process multi-day events that are also recurring events
    if (element.recurrence !== null) {
      eventList.push(element);
      return;
    }

    for (let index = 0; index <= totalDaysBetween; index++) {
      const newEvent: IEvent = { ...element };

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
