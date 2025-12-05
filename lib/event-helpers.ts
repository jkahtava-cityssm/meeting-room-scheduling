import { TVisibleHours } from "@/lib/types";
import { addDays, differenceInDays, endOfDay, isWithinInterval, set, startOfDay } from "date-fns";
import { rrulestr } from "rrule";
import { IEvent } from "./schemas/calendar";

export function generateRecurringEventsInPeriod(events: IEvent[], periodStart: Date, periodEnd: Date) {
  const eventList: IEvent[] = [];

  const startUTC = setPartsToUTCDate(periodStart);
  const endUTC = setPartsToUTCDate(periodEnd);
  //let testA;
  //let testB;
  //let con;
  for (const event of events) {
    if (!event.recurrenceId || !event.recurrence?.rule) continue;

    const rrule = rrulestr(event.recurrence.rule, { cache: true });
    //con = rrule.all()[0];
    //const recurrenceDates2 = rrule.between(periodStart, periodEnd, true);
    const recurrenceDates = rrule.between(startUTC, endUTC, true);

    //testA = recurrenceDates2;
    //testB = recurrenceDates;
    for (const recurrenceDate of recurrenceDates) {
      const recurringUTC = setUTCPartsToDate(recurrenceDate);

      const year = recurringUTC.getFullYear();
      const month = recurringUTC.getMonth();
      const date = recurringUTC.getDate();

      eventList.push({
        ...event,
        title: "Series" + (event.title ? " - " + event.title : ""),
        startDate: set(event.startDate, { year, month, date }).toISOString(),
        endDate: set(event.endDate, { year, month, date }).toISOString(),
      });
    }
  }
  return eventList;
}

export function generateMultiDayEventsInPeriod(
  events: IEvent[],
  periodStart: Date,
  periodEnd: Date,
  minStartTime: number,
  maxEndTime: number,
) {


  const eventList: IEvent[] = [];

  for (const event of events) {
    if (event.recurrenceId !== null) continue;

    const currentStartDate = event.startDate;
    const currentEndDate = event.endDate;

    const totalDaysBetween = differenceInDays(endOfDay(currentEndDate), startOfDay(currentStartDate));

    if (totalDaysBetween === 0) {
      eventList.push(event);
      continue;
    }

    for (let dayIndex = 0; dayIndex <= totalDaysBetween; dayIndex++) {
      const newDay = set(addDays(currentStartDate, dayIndex), { hours: 0, minutes: 0, seconds: 0, milliseconds: 0 });

      if (!isWithinInterval(newDay, { start: periodStart, end: periodEnd })) {
        continue;
      }

      const newEvent = {
        ...event,
        eventIsSplit: true,
        title: `Day ${dayIndex + 1} of ${totalDaysBetween + 1}` + (event.title ? " - " + event.title : ""),
      };

      if (dayIndex === 0) {
        //First Day
        newEvent.endDate = set(currentStartDate, {
          hours: maxEndTime,
          minutes: 0,
          seconds: 0,
          milliseconds: 0,
        }).toISOString();
        newEvent.multiDay = { position: "first" };
      } else if (dayIndex === totalDaysBetween) {
        //LAST DAY
        newEvent.startDate = set(currentEndDate, {
          hours: minStartTime,
          minutes: 0,
          seconds: 0,
          milliseconds: 0,
        }).toISOString();

        newEvent.multiDay = { position: "last" };
      } else {
        newEvent.startDate = set(newDay, {
          hours: minStartTime,
          minutes: 0,
          seconds: 0,
          milliseconds: 0,
        }).toISOString();
        newEvent.endDate = set(newDay, { hours: maxEndTime, minutes: 0, seconds: 0, milliseconds: 0 }).toISOString();
        newEvent.multiDay = { position: "middle" };
        //MIDDLE DAY
      }
      eventList.push(newEvent);
    }
  }
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
