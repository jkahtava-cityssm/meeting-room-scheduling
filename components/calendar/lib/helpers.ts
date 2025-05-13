import {
  addDays,
  addMonths,
  addWeeks,
  subDays,
  subMonths,
  subWeeks,
  isSameWeek,
  isSameDay,
  isSameMonth,
  startOfWeek,
  startOfMonth,
  endOfMonth,
  endOfWeek,
  format,
  parseISO,
  differenceInMinutes,
  eachDayOfInterval,
  startOfDay,
  differenceInDays,
  endOfYear,
  startOfYear,
  subYears,
  addYears,
  isSameYear,
  isWithinInterval,
  setHours,
  formatISO,
  set,
  endOfDay,
  areIntervalsOverlapping,
  isWeekend,
  setDate,
  compareAsc,
} from "date-fns";

import type { ICalendarCell, IEvent } from "@/components/calendar/lib/interfaces";
import type { TCalendarView, TRecurrencePattern, TVisibleHours, TWorkingHours } from "@/components/calendar/lib/types";
import { start } from "repl";
import { RECURRENCE_PATTERN, RECURRENCE_TYPE } from "@/prisma/seed-data";

export const VISIBLE_HOURS: TVisibleHours = { from: 0, to: 24 };
export const MAX_VISIBLE_EVENTS = 5;

// ================ Header helper functions ================ //

export function rangeText(view: TCalendarView, date: Date) {
  const formatString = "MMM d, yyyy";
  let start: Date;
  let end: Date;

  switch (view) {
    case "year":
      start = startOfYear(date);
      end = endOfYear(date);
      break;
    case "month":
      start = startOfMonth(date);
      end = endOfMonth(date);
      break;
    case "week":
      start = startOfWeek(date);
      end = endOfWeek(date);
      break;
    case "day":
    case "agenda":
      return format(date, formatString);
    default:
      return "Error while formatting ";
  }

  return `${format(start, formatString)} - ${format(end, formatString)}`;
}

export function navigateDate(date: Date, view: TCalendarView, direction: "previous" | "next"): Date {
  const operations = {
    agenda: direction === "next" ? addDays : subDays,
    year: direction === "next" ? addYears : subYears,
    month: direction === "next" ? addMonths : subMonths,
    week: direction === "next" ? addWeeks : subWeeks,
    day: direction === "next" ? addDays : subDays,
  };

  return operations[view](date, 1);
}
/*
export function getEventsCount(events: IEvent[], date: Date, view: TCalendarView): number {
  const compareFns = {
    agenda: isSameDay,
    year: isSameYear,
    day: isSameDay,
    week: isSameWeek,
    month: isSameMonth,
  };

  return events.filter((event) => compareFns[view](new Date(event.startDate), date)).length;
}

// ================ Week and day view helper functions ================ //

export function getCurrentEvents(events: IEvent[]) {
  const now = new Date();
  return (
    events.filter((event) =>
      isWithinInterval(now, {
        start: event.startDate,
        end: event.endDate,
      })
    ) || null
  );
}
*/

export function splitMultiDayEvents(events: IEvent[], periodStart: Date, periodEnd: Date, visibleHours: TVisibleHours) {
  /* 
    CHECK IF THE EVENT STARTS TODAY
    
    CHECK IF THE EVENT ENDS TODAY

    IF THE EVENT STARTS AND ENDS IN THE SAME DAY IT WONT BE IN THIS LIST?

    IF THE EVENT STARTED TODAY SET THE END TIME TO THE MAXIMUM VISIBLE HOUR

    IF THE EVENT ENDED TODAY SET THE START TIME TO THE MINIMUM VISIBLE HOUR

    IF THE EVENT STARTS AND ENDS ON A DIFFERENT DAY SET THE START AND END TIMES TO THE MIN AND MAX VISIBLE HOURS
  */

  const minStartTime = visibleHours.from;
  const maxEndTime = visibleHours.to;

  const eventList: IEvent[] = [];

  events.forEach((element) => {
    const currentStartDate = element.startDate;
    const currentEndDate = element.endDate;

    //const totalDaysBetween = differenceInDays(endOfDay(currentEndDate), startOfDay(currentStartDate));
    const totalDaysBetween = differenceInDays(currentEndDate, currentStartDate);

    if (totalDaysBetween === 0) {
      eventList.push(element);
      return;
    }

    for (let index = 0; index < totalDaysBetween; index++) {
      const newEvent = { ...element, eventIsSplit: true };

      const newDay = set(addDays(currentStartDate, index), { hours: 0, minutes: 0, seconds: 0, milliseconds: 0 });

      if (!isWithinInterval(newDay, { start: periodStart, end: periodEnd })) {
        continue;
      }

      if (index === 0) {
        //First Day
        newEvent.title = "Day " + (index + 1) + " of " + (totalDaysBetween + 1) + " • " + newEvent.title;
        newEvent.endDate = set(currentStartDate, { hours: maxEndTime, minutes: 0, seconds: 0, milliseconds: 0 });
      } else if (index === totalDaysBetween) {
        //LAST DAY
        newEvent.title = "Day " + (index + 1) + " of " + (totalDaysBetween + 1) + " • " + newEvent.title;
        newEvent.startDate = set(currentEndDate, { hours: minStartTime, minutes: 0, seconds: 0, milliseconds: 0 });
      } else {
        newEvent.title = "Day " + (index + 1) + " of " + (totalDaysBetween + 1) + " • " + newEvent.title;

        newEvent.startDate = set(newDay, { hours: minStartTime, minutes: 0, seconds: 0, milliseconds: 0 });
        newEvent.endDate = set(newDay, { hours: maxEndTime, minutes: 0, seconds: 0, milliseconds: 0 });
        //MIDDLE DAY
      }
      eventList.push(newEvent);
    }
  });

  return eventList;
}

export function getOverlappingMultiDayEvents(events: IEvent[], selectedDate: Date) {
  const dayStart = startOfDay(selectedDate);
  const dayEnd = endOfDay(selectedDate);

  return events.filter((event) => {
    const eventStart = event.startDate;
    const eventEnd = event.endDate;

    const isOverlapping =
      isWithinInterval(dayStart, { start: eventStart, end: eventEnd }) ||
      isWithinInterval(dayEnd, { start: eventStart, end: eventEnd }) ||
      (eventStart <= dayStart && eventEnd >= dayEnd);

    return isOverlapping;
  });
  /*.sort((a, b) => {
      const durationA = differenceInDays(a.endDate), a.startDate));
      const durationB = differenceInDays(b.endDate), b.startDate));
      return durationB - durationA;
    });*/
}

export function groupEvents(dayEvents: IEvent[]) {
  const sortedEvents = dayEvents.sort((a, b) => a.startDate.getTime() - b.startDate.getTime());
  const groups: IEvent[][] = [];

  for (const event of sortedEvents) {
    const eventStart = event.startDate;

    let placed = false;
    for (const group of groups) {
      const lastEventInGroup = group[group.length - 1];
      const lastEventEnd = lastEventInGroup.endDate;

      if (eventStart >= lastEventEnd) {
        group.push(event);
        placed = true;
        break;
      }
    }

    if (!placed) groups.push([event]);
  }

  return groups;
}

export function getEventBlockStyle(
  event: IEvent,
  day: Date,
  groupIndex: number,
  groupSize: number,
  visibleHoursRange?: { from: number; to: number }
) {
  const startDate = event.startDate;
  const dayStart = new Date(day.setHours(0, 0, 0, 0));
  const eventStart = startDate < dayStart ? dayStart : startDate;
  const startMinutes = differenceInMinutes(eventStart, dayStart);

  let top;

  if (visibleHoursRange) {
    const visibleStartMinutes = visibleHoursRange.from * 60;
    const visibleEndMinutes = visibleHoursRange.to * 60;
    const visibleRangeMinutes = visibleEndMinutes - visibleStartMinutes;
    top = ((startMinutes - visibleStartMinutes) / visibleRangeMinutes) * 100;
  } else {
    top = (startMinutes / 1440) * 100;
  }

  const width = 100 / groupSize;
  const left = groupIndex * width;

  return { top: `${top}%`, width: `${width}%`, left: `${left}%` };
}

export function isWorkingHour(day: Date, hour: number, workingHours: TWorkingHours) {
  const dayIndex = day.getDay() as keyof typeof workingHours;
  const dayHours = workingHours[dayIndex];
  return hour >= dayHours.from && hour < dayHours.to;
}

export function hasOverlap(groupedEvents: IEvent[][], event: IEvent, index: number): boolean {
  return groupedEvents.some(
    (otherGroup, otherIndex) =>
      otherIndex !== index &&
      otherGroup.some((otherEvent) =>
        areIntervalsOverlapping(
          {
            start: event.startDate,
            end: event.endDate,
          },
          {
            start: otherEvent.startDate,
            end: otherEvent.endDate,
          }
        )
      )
  );
}

/**
 * Loop through each event, increase the Earliest and Latest Visible Hours if an Event occurs outside of the window
 * @param visibleHours
 * @param singleDayEvents
 * @returns
 */
export function getVisibleHours(visibleHours: TVisibleHours, singleDayEvents: IEvent[]) {
  let earliestEventHour = visibleHours.from;
  let latestEventHour = visibleHours.to;

  singleDayEvents.forEach((event) => {
    const startHour = event.startDate.getHours();
    const endTime = event.endDate;
    const endHour = endTime.getHours() + (endTime.getMinutes() > 0 ? 1 : 0);
    if (startHour < earliestEventHour) earliestEventHour = startHour;
    if (endHour > latestEventHour) latestEventHour = endHour;
  });

  latestEventHour = Math.min(latestEventHour, 24);

  const hours = Array.from({ length: latestEventHour - earliestEventHour }, (_, i) => i + earliestEventHour);

  return { hours, earliestEventHour, latestEventHour };
}

// ================ Month view helper functions ================ //

export function getCalendarCells(selectedDate: Date): ICalendarCell[] {
  const currentYear = selectedDate.getFullYear();
  const currentMonth = selectedDate.getMonth();

  const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

  const daysInMonth = getDaysInMonth(currentYear, currentMonth);
  const firstDayOfMonth = getFirstDayOfMonth(currentYear, currentMonth);
  const daysInPrevMonth = getDaysInMonth(currentYear, currentMonth - 1);
  const totalDays = firstDayOfMonth + daysInMonth;

  const prevMonthCells = Array.from({ length: firstDayOfMonth }, (_, i) => ({
    day: daysInPrevMonth - firstDayOfMonth + i + 1,
    currentMonth: false,
    date: new Date(currentYear, currentMonth - 1, daysInPrevMonth - firstDayOfMonth + i + 1),
  }));

  const currentMonthCells = Array.from({ length: daysInMonth }, (_, i) => ({
    day: i + 1,
    currentMonth: true,
    date: new Date(currentYear, currentMonth, i + 1),
  }));

  const nextMonthCells = Array.from({ length: (7 - (totalDays % 7)) % 7 }, (_, i) => ({
    day: i + 1,
    currentMonth: false,
    date: new Date(currentYear, currentMonth + 1, i + 1),
  }));

  return [...prevMonthCells, ...currentMonthCells, ...nextMonthCells];
}

export function getMonthCellEvents(date: Date, events: IEvent[], eventPositions: Record<string, number>) {
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

/*########################################################################
    GENERIC FUNCTIONS
########################################################################*/

export function filterEventsByRoom(events: IEvent[], selectedRoomId: string) {
  return events.filter((event) => {
    return event.roomId.toString() === selectedRoomId || selectedRoomId === "-1";
  });
}

export function calculateMonthlyRecurrenceEndDate(startDate: Date, occurrences: number, day: number, months: number) {
  let iterations = occurrences;
  let firstMonth = set(startDate, { date: day });
  if (compareAsc(startDate, firstMonth) > 0) {
    firstMonth = addMonths(firstMonth, months);
    iterations -= 1;
  }
  //once we found the first occurrence we can add all the others
  return addMonths(firstMonth, months * iterations);
}

export function calculateYearlyRecurrenceEndDate(
  startDate: Date,
  occurrences: number,
  day: number,
  month: number,
  years: number
) {
  //OUTLOOK HAS AN INTERESTING BEHAVIOUR I WILL TRY AND MIMIC
  //IT SETS THE FIRST EVENT TO OCCUR IN THE SAME YEAR
  //SO IF THE RECURRENCE IS EVERY 3 YEARS IT WILL SET THE FIRST OCCURRENCE TO THIS YEAR.
  //2026-08-21, 1 Occurrence @ 3 Years, September, 19th = 2026-09-19
  //THEN EACH RECURRENCE IS CALCULATED BASED ON THIS VALUE 2026-09-19
  //IF THE START DATE WOULD HAPPEN AFTER THOUGH SO IF 2026-09-20 THEN IT BECOMES 2029-09-19
  let iterations = occurrences;
  let firstYear = set(startDate, { month: month, date: day });

  if (compareAsc(startDate, firstYear) > 0) {
    firstYear = addYears(firstYear, years);
    iterations -= 1;
  }

  return addYears(firstYear, years * iterations);
}
