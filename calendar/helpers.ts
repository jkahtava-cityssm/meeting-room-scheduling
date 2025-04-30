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
} from "date-fns";

import type { ICalendarCell, IEvent, IMultiDayBlock } from "@/calendar/interfaces";
import type { TCalendarView, TVisibleHours, TWorkingHours } from "@/calendar/types";
import { MAX_VISIBLE_EVENTS } from "./mocks";

// ================ Header helper functions ================ //

export function rangeText(view: TCalendarView, date: Date) {
  const formatString = "MMM d, yyyy";
  let start: Date;
  let end: Date;

  switch (view) {
    case "agenda":
      start = startOfMonth(date);
      end = endOfMonth(date);
      break;
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
      return format(date, formatString);
    default:
      return "Error while formatting ";
  }

  return `${format(start, formatString)} - ${format(end, formatString)}`;
}

export function navigateDate(date: Date, view: TCalendarView, direction: "previous" | "next"): Date {
  const operations = {
    agenda: direction === "next" ? addMonths : subMonths,
    year: direction === "next" ? addYears : subYears,
    month: direction === "next" ? addMonths : subMonths,
    week: direction === "next" ? addWeeks : subWeeks,
    day: direction === "next" ? addDays : subDays,
  };

  return operations[view](date, 1);
}

export function getEventsCount(events: IEvent[], date: Date, view: TCalendarView): number {
  const compareFns = {
    agenda: isSameMonth,
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
        start: parseISO(event.startDate),
        end: parseISO(event.endDate),
      })
    ) || null
  );
}

export function splitMultiDayEvents(events: IEvent[], visibleHours: TVisibleHours) {
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
    const currentStartDate = parseISO(element.startDate);
    const currentEndDate = parseISO(element.endDate);

    const endDay = endOfDay(currentEndDate);
    const startDay = startOfDay(currentStartDate);

    const totalDaysBetween = differenceInDays(endOfDay(currentEndDate), startOfDay(currentStartDate));

    for (let index = 0; index <= totalDaysBetween; index++) {
      const newEvent = { ...element };

      if (index === 0) {
        //First Day
        newEvent.title = "Day " + (index + 1) + " of " + (totalDaysBetween + 1) + " • " + newEvent.title;
        newEvent.endDate = formatISO(
          set(currentStartDate, { hours: maxEndTime, minutes: 0, seconds: 0, milliseconds: 0 })
        );
      } else if (index === totalDaysBetween) {
        //LAST DAY
        newEvent.title = "Day " + (index + 1) + " of " + (totalDaysBetween + 1) + " • " + newEvent.title;
        newEvent.startDate = formatISO(
          set(currentEndDate, { hours: minStartTime, minutes: 0, seconds: 0, milliseconds: 0 })
        );
      } else {
        const newDay = addDays(currentStartDate, index);

        newEvent.title = "Day " + (index + 1) + " of " + (totalDaysBetween + 1) + " • " + newEvent.title;

        newEvent.startDate = formatISO(set(newDay, { hours: minStartTime, minutes: 0, seconds: 0, milliseconds: 0 }));
        newEvent.endDate = formatISO(set(newDay, { hours: maxEndTime, minutes: 0, seconds: 0, milliseconds: 0 }));
        //MIDDLE DAY
      }
      eventList.push(newEvent);
    }
  });

  return eventList;
}

export function generateMultiDayBlocks(
  event: IEvent,
  visibleHours: TVisibleHours

  //visibleHours: TVisibleHours
): IEvent[] {
  const minStartTime = visibleHours.from;
  const maxEndTime = visibleHours.to;

  const eventList: IEvent[] = [];

  const currentStartDate = parseISO(event.startDate);
  const currentEndDate = parseISO(event.endDate);

  const totalDaysBetween = differenceInDays(endOfDay(currentEndDate), startOfDay(currentStartDate));

  for (let index = 0; index <= totalDaysBetween; index++) {
    const title = "Day " + (index + 1) + " of " + (totalDaysBetween + 1) + " • " + event.title;

    let startDate = "";
    let endDate = "";

    if (index === 0) {
      //First Day
      startDate = formatISO(currentStartDate);
      //endDate = formatISO(endOfDay(currentStartDate));
      endDate = formatISO(set(currentStartDate, { hours: maxEndTime, minutes: 0, seconds: 0, milliseconds: 0 }));
    } else if (index === totalDaysBetween) {
      //LAST DAY

      startDate = formatISO(set(currentEndDate, { hours: minStartTime, minutes: 0, seconds: 0, milliseconds: 0 }));
      //startDate = formatISO(startOfDay(currentStartDate));
      endDate = formatISO(currentEndDate);
    } else {
      const newDay = addDays(currentStartDate, index);
      //startDate = formatISO(startOfDay(newDay));
      //endDate = formatISO(endOfDay(newDay));

      startDate = formatISO(set(newDay, { hours: minStartTime, minutes: 0, seconds: 0, milliseconds: 0 }));
      endDate = formatISO(set(newDay, { hours: maxEndTime, minutes: 0, seconds: 0, milliseconds: 0 }));
      //MIDDLE DAY
    }
    eventList.push({
      ...event,
      key: event.key + "-" + index,
      startDate: startDate,
      endDate: endDate,
      title: title,
      parentEvent: event,
    });
  }

  return eventList;
}

export function getOverlappingMultiDayEvents(events: IEvent[], selectedDate: Date) {
  const dayStart = startOfDay(selectedDate);
  const dayEnd = endOfDay(selectedDate);

  return events.filter((event) => {
    const eventStart = parseISO(event.startDate);
    const eventEnd = parseISO(event.endDate);

    const isOverlapping =
      isWithinInterval(dayStart, { start: eventStart, end: eventEnd }) ||
      isWithinInterval(dayEnd, { start: eventStart, end: eventEnd }) ||
      (eventStart <= dayStart && eventEnd >= dayEnd);

    return isOverlapping;
  });
  /*.sort((a, b) => {
      const durationA = differenceInDays(parseISO(a.endDate), parseISO(a.startDate));
      const durationB = differenceInDays(parseISO(b.endDate), parseISO(b.startDate));
      return durationB - durationA;
    });*/
}

export function groupEvents(dayEvents: IEvent[]) {
  const sortedEvents = dayEvents.sort((a, b) => parseISO(a.startDate).getTime() - parseISO(b.startDate).getTime());
  const groups: IEvent[][] = [];

  for (const event of sortedEvents) {
    const eventStart = parseISO(event.startDate);

    let placed = false;
    for (const group of groups) {
      const lastEventInGroup = group[group.length - 1];
      const lastEventEnd = parseISO(lastEventInGroup.endDate);

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
  const startDate = parseISO(event.startDate);
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
            start: parseISO(event.startDate),
            end: parseISO(event.endDate),
          },
          {
            start: parseISO(otherEvent.startDate),
            end: parseISO(otherEvent.endDate),
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
    const startHour = parseISO(event.startDate).getHours();
    const endTime = parseISO(event.endDate);
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

export function calculateMonthEventPositions(multiDayEvents: IEvent[], singleDayEvents: IEvent[], selectedDate: Date) {
  const monthStart = startOfMonth(selectedDate);
  const monthEnd = endOfMonth(selectedDate);

  const eventPositions: { [key: string]: number } = {};
  const occupiedPositions: { [key: string]: boolean[] } = {};

  eachDayOfInterval({ start: monthStart, end: monthEnd }).forEach((day) => {
    occupiedPositions[day.toISOString()] = [false, false, false];
  });

  const sortedEvents = [
    ...multiDayEvents.sort((a, b) => {
      const aDuration = differenceInDays(parseISO(a.endDate), parseISO(a.startDate));
      const bDuration = differenceInDays(parseISO(b.endDate), parseISO(b.startDate));
      return bDuration - aDuration || parseISO(a.startDate).getTime() - parseISO(b.startDate).getTime();
    }),
    ...singleDayEvents.sort((a, b) => parseISO(a.startDate).getTime() - parseISO(b.startDate).getTime()),
  ];

  sortedEvents.forEach((event) => {
    const eventStart = parseISO(event.startDate);
    const eventEnd = parseISO(event.endDate);
    const eventDays = eachDayOfInterval({
      start: eventStart < monthStart ? monthStart : eventStart,
      end: eventEnd > monthEnd ? monthEnd : eventEnd,
    });

    let position = -1;

    for (let i = 0; i < MAX_VISIBLE_EVENTS; i++) {
      if (
        eventDays.every((day) => {
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
      eventPositions[event.id] = position;
    }
  });

  return eventPositions;
}

export function getMonthCellEvents(date: Date, events: IEvent[], eventPositions: Record<string, number>) {
  const eventsForDate = events.filter((event) => {
    const eventStart = parseISO(event.startDate);
    const eventEnd = parseISO(event.endDate);
    return (date >= eventStart && date <= eventEnd) || isSameDay(date, eventStart) || isSameDay(date, eventEnd);
  });

  return eventsForDate
    .map((event) => ({
      ...event,
      position: eventPositions[event.id] ?? -1,
      isMultiDay: !isSameDay(event.endDate, event.startDate), // event.startDate !== event.endDate,
    }))
    .sort((a, b) => {
      if (a.isMultiDay && !b.isMultiDay) return -1;
      if (!a.isMultiDay && b.isMultiDay) return 1;
      return a.position - b.position;
    });
}
