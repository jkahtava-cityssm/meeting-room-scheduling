import {
  addDays,
  addMonths,
  addWeeks,
  subDays,
  subMonths,
  subWeeks,
  isSameDay,
  startOfWeek,
  startOfMonth,
  endOfMonth,
  endOfWeek,
  format,
  differenceInMinutes,
  startOfDay,
  endOfYear,
  startOfYear,
  subYears,
  addYears,
  isWithinInterval,
  set,
  endOfDay,
  areIntervalsOverlapping,
  compareAsc,
  getDaysInMonth,
  intervalToDuration,
  formatDuration,
} from "date-fns";

import type { ICalendarCell } from "@/lib/interfaces";
import type { TCalendarView, TVisibleHours, TWorkingHours } from "@/lib/types";

import { IEvent } from "./schemas/calendar";

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

export function navigateURL(date: Date | null, view: TCalendarView): string {
  const path = {
    agenda: "calendar?view=agenda",
    year: "calendar?view=year",
    month: "calendar?view=month",
    week: "calendar?view=week",
    day: "calendar?view=day",
  };

  const dateParams = {
    agenda: "&selectedDate=",
    year: "&selectedDate=",
    month: "&selectedDate=",
    week: "&selectedDate=",
    day: "&selectedDate=",
  };

  const formatDate = (view: TCalendarView, value: Date) => {
    switch (view) {
      case "year":
        return format(value, "yyyy");
      case "month":
        return format(value, "yyyy-MM");
      case "week":
        return format(value, "RRRR-II");
      case "agenda":
      case "day":
      default:
        return format(value, "yyyy-MM-dd");
    }
  };

  if (date === null) {
    return path[view];
  }

  return path[view] + dateParams[view] + formatDate(view, date);
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

export function calculateEventBlockStyle(
  event: IEvent,
  day: Date,
  groupIndex: number,
  groupSize: number,
  hasOverlap: boolean,
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

  const width = hasOverlap ? 100 / groupSize : 100;
  const left = hasOverlap ? groupIndex * width : 0;

  //On occassion there are hydration errors associate with these calculations
  //rounding to 2 decimal places should resolve it, since most errors occur at 10 decimal places
  const roundedTop = roundToPrecision(top, 2); // Math.round(top * 100) / 100;
  const roundedWidth = roundToPrecision(width, 2); // Math.round(width * 100) / 100;
  const roundedLeft = roundToPrecision(left, 2); // Math.round(left * 100) / 100;

  return { top: `${roundedTop}%`, width: `${roundedWidth}%`, left: `${roundedLeft}%` };
}
/**
 * Converts Local Datetime values into RRULE UTC datetime
 *
 * @param date Local Datetime
 * @returns new UTC Date
 *
 * * RRULE uses a UTC datetime to calculate recurrence
 * * RRULE dates need to be converted to UTC Datetimes
 * * see https://github.com/jkbrzt/rrule/issues/336 explains in further detail
 */
export function convertDateToRRuleDate(date: Date) {
  return new Date(
    Date.UTC(date.getFullYear(), date.getMonth(), date.getDate(), date.getHours(), date.getMinutes(), date.getSeconds())
  );
}

export function mergeDateWithTime(date: Date, time: Date) {
  const DateOnly = new Date(date.toDateString());
  const DateTime = new Date(DateOnly.setHours(time.getHours(), time.getMinutes()));

  return DateTime;
}

/**
 * Converts RRule UTC Date into a Local Datetime

 * @param date UTC Datetime
 * @returns new Local Datetime
 * 
 * * RRULE uses a UTC datetime to calculate recurrence
 * * RRULE dates need to be converted back to Local Datetimes
 * * see https://github.com/jkbrzt/rrule/issues/336 explains in further detail 
 */
export function convertRRuleDateToDate(date: Date) {
  return new Date(
    date.getUTCFullYear(),
    date.getUTCMonth(),
    date.getUTCDate(),
    date.getUTCHours(),
    date.getUTCMinutes(),
    date.getUTCSeconds()
  );
}

export function roundToPrecision(value: number, precision: number) {
  if (precision < 0) precision = 0;

  const padding = [
    ...Array(precision)
      .keys()
      .map(() => {
        return "0";
      }),
  ].join("");

  const adjustment = Number("1" + padding);
  return Math.round(value * adjustment) / adjustment;
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

export function getDaysInView(selectedDate: Date) {
  const daysInMonth = getDaysInMonth(selectedDate);
  const firstDayOfMonth = startOfMonth(selectedDate);
  const beforeDays = firstDayOfMonth.getDay();

  const daysInLastRow = (daysInMonth + beforeDays) % 7;
  const afterDays = daysInLastRow > 0 ? 7 - daysInLastRow : 0;
  const firstDate = startOfDay(subDays(selectedDate, beforeDays));
  const lastDate = endOfDay(addDays(firstDayOfMonth, daysInMonth + afterDays - 1));

  return { startDate: firstDate, endDate: lastDate };
}

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

export const getDurationText = (startDate: Date, startTime: Date, endDate: Date, endTime: Date): string => {
  const startDateTime = combineDateTime(startDate, startTime);
  const endDateTime = combineDateTime(endDate, endTime);

  const duration = formatDuration(intervalToDuration({ start: startDateTime, end: endDateTime }), {
    format: ["years", "months", "days", "hours", "minutes"],
    delimiter: ", ",
  });

  return duration.length === 0 ? "0 Minutes" : duration;
};

export const combineDateTime = (dateField: Date, timeField: Date) => {
  return new Date(dateField.setHours(timeField.getHours(), timeField.getMinutes()));
};

export function filterEventsByRoom(events: IEvent[], selectedRoomId: string) {
  const results = events.filter((event) => {
    return event.roomId.toString() === selectedRoomId || selectedRoomId === "-1";
  });
  return results;
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

/**
 *
 *
 */
