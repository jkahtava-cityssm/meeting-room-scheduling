import { IEvent, SEvent } from "@/lib/schemas/schemas";
import { TVisibleHours } from "@/lib/types";
import { generateMultiDayEventsInPeriod, generateRecurringEventsInPeriod } from "@/services/events";
import {
  addMonths,
  differenceInDays,
  eachDayOfInterval,
  endOfMonth,
  endOfYear,
  format,
  getDaysInMonth,
  isSameDay,
  isToday,
  parseJSON,
  startOfDay,
  startOfMonth,
  startOfYear,
} from "date-fns";
import { DayView, MonthView, YearProcessData, YearResponseData } from "./calendar-year-view";
import { filterEventsByRoom, MAX_VISIBLE_EVENTS } from "../../lib/helpers";
import { MonthProcessData } from "./calendar-month-view";
import { z } from "zod";

self.onmessage = (event: MessageEvent<MonthProcessData>) => {
  if (event.data) {
    const result = calculateEventPositions(event.data);
    self.postMessage(result);
  }
};

function calculateEventPositions(monthData: MonthProcessData) {
  const monthStart = startOfMonth(monthData.selectedDate);
  const monthEnd = endOfMonth(monthData.selectedDate);

  const events = z.array(SEvent).parse(monthData.events);

  /*const roomEvents = events.filter((event:IEvent) => {
    return event.roomId.toString() === monthData.selectedRoomId
  })*/

  const multiDayEvents = events.filter((event: IEvent) => {
    return !isSameDay(event.startDate, event.endDate);
  });

  const singleDayEvents = events.filter((event: IEvent) => {
    return isSameDay(event.startDate, event.endDate);
  });

  /*
  MULTI DAY EVENTS NEED TO BE IDENTIFIED FIRST
  - ADD ALL EVENTS TO EACH DAY
  - SORT EACH DAYS EVENTS
  - FIND THE DAY WITH THE MOST EVENTS WORKING DOWN
  
  */

  const eventPositions: { [key: string]: number } = {};
  const occupiedPositions: { [key: string]: boolean[] } = {};

  //FILL OCCUPIED POSITIONS WITH EVERY DATE BETWEEN START AND END
  eachDayOfInterval({ start: monthStart, end: monthEnd }).forEach((day) => {
    occupiedPositions[day.toISOString()] = [false, false, false];
  });

  //SORT ALL THE EVENTS
  const sortedEvents = [
    ...multiDayEvents.sort((firstEvent, secondEvent) => {
      const aDuration = differenceInDays(firstEvent.endDate, firstEvent.startDate);
      const bDuration = differenceInDays(secondEvent.endDate, secondEvent.startDate);

      const firstEventTime = firstEvent.startDate.getTime();
      const secondEventTime = secondEvent.startDate.getTime();
      return bDuration - aDuration || firstEventTime - secondEventTime;
    }),
    ...singleDayEvents.sort((a, b) => a.startDate.getTime() - b.startDate.getTime()),
  ];

  sortedEvents.forEach((event) => {
    const eventStart = event.startDate;
    const eventEnd = event.endDate;

    const eventDays = eachDayOfInterval({
      start: eventStart < monthStart ? monthStart : eventStart,
      end: eventEnd > monthEnd ? monthEnd : eventEnd,
    });

    let position = -1;

    for (let i = 0; i < MAX_VISIBLE_EVENTS; i++) {
      if (
        eventDays.every((day) => {
          //LOOKUP IF THE OCCUPIED POSITION IS FOUND
          const dayPositions = occupiedPositions[startOfDay(day).toISOString()];
          return dayPositions && !dayPositions[i];
        })
      ) {
        position = i;
        break;
      }
    }

    if (position !== -1) {
      eventDays.forEach((day) => {
        const dayKey = startOfDay(day).toISOString();
        occupiedPositions[dayKey][position] = true;
      });
      eventPositions[event.eventId] = position;
    }
  });

  return eventPositions;
}

function getMonthCellEvents(date: Date, events: IEvent[], eventPositions: Record<string, number>) {
  const eventsForDate = events.filter((event) => {
    const eventStart = event.startDate;
    const eventEnd = event.endDate;
    return (date >= eventStart && date <= eventEnd) || isSameDay(date, eventStart) || isSameDay(date, eventEnd);
  });

  return eventsForDate
    .map((event) => ({
      ...event,
      position: eventPositions[event.eventId] ?? -1,
      isMultiDay: !isSameDay(event.endDate, event.startDate), // event.startDate !== event.endDate,
    }))
    .sort((a, b) => {
      if (a.isMultiDay && !b.isMultiDay) return -1;
      if (!a.isMultiDay && b.isMultiDay) return 1;
      return a.position - b.position;
    });
}
