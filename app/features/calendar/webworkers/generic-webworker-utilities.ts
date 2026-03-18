import { IEvent, SEvent } from "@/lib/schemas/calendar";
import { TIME_BLOCK_SIZE, TStatusKey, TVisibleHours } from "@/lib/types";
import {
  addDays,
  addMonths,
  areIntervalsOverlapping,
  differenceInDays,
  differenceInMinutes,
  eachDayOfInterval,
  endOfDay,
  endOfWeek,
  endOfYear,
  format,
  getDaysInMonth,
  isEqual,
  isSameDay,
  isSameMonth,
  isSunday,
  isToday,
  isWithinInterval,
  set,
  startOfDay,
  startOfMonth,
  startOfWeek,
  startOfYear,
  subDays,
} from "date-fns";

import { rrulestr } from "rrule";
import {
  CalendarAction,
  GroupingType,
  IEventBlock,
  IEventView,
  IMonthDayView,
  IMonthWeekView,
  ISODateString,
  IYearDayView,
  IYearMonthView,
} from "./generic-webworker";
import { daysBetween } from "rrule/dist/esm/dateutil";

export function calculateViewBoundaries(config: TVisibleHours, events: IEvent[], viewStart: Date, viewEnd: Date) {
  let minHour = config.from;
  let maxHour = config.to;

  events.forEach((event) => {
    const isMultiDay = !!event.multiDay;
    const position = event.multiDay?.position;

    const dateToProcess = event.multiDay?.calculatedDate ? new Date(event.multiDay.calculatedDate) : null;

    // --- START BOUNDARY (minHour) ---
    if (!isMultiDay) {
      // Regular single-day event: check start time normally
      const startHour = new Date(event.startDate).getHours();
      if (startHour < minHour) minHour = startHour;
    } else if (position === "first" && dateToProcess) {
      // Only the 'first' day of a multi-day event can shrink the minHour via its start time
      const startHour = dateToProcess.getHours();
      const startMinutes = dateToProcess.getMinutes();
      const visualStartHour = startHour + (startMinutes > 0 ? 1 : 0);
      if (startHour < minHour) minHour = startHour;
      if (visualStartHour > maxHour) maxHour = visualStartHour;
    }

    // --- END BOUNDARY (maxHour) & STEP-BACK RULE ---
    // We process the end boundary for single-day events OR the 'last' day of multi-day
    if (!isMultiDay || position === "last") {
      const endDate = dateToProcess || new Date(event.endDate);
      const endHour = endDate.getHours();
      const endMinutes = endDate.getMinutes();
      const visualEndHour = endHour + (endMinutes > 0 ? 1 : 0);

      // 1. Expand maxHour if it ends late
      if (visualEndHour > maxHour) {
        maxHour = visualEndHour;
      }

      // 2. The Step-Back Rule:
      // If it ends early (e.g., 2 AM), ensure we show the hour before (1 AM)
      // Only apply this if it's below our current window
      if (visualEndHour > 0 && visualEndHour <= minHour) {
        const neededStart = visualEndHour - 1;
        minHour = Math.max(0, neededStart);
      }
    }

    if (isMultiDay && position === "single") {
      minHour = 0;
      maxHour = 24;
    }
  });

  return {
    from: Math.max(0, minHour),
    to: Math.min(24, maxHour),
  };
}

/** * Strategy for Timeline Views (Day, Public, Week)
 * Returns Record<string, IEventBlock[]>
 */
export function transformToRoomBlocks(
  events: IEvent[],
  earliestEventHour: number,
  latestEventHour: number,
): { totalEvents: number; hours: number[]; roomBlocks: Record<string, IEventBlock[]> } {
  const hours = Array.from({ length: latestEventHour - earliestEventHour }, (_, i) => i + earliestEventHour);

  const groupByEvents: Record<string, IEvent[]> = {};
  const roomBlocks: Record<string, IEventBlock[]> = {};

  events.forEach((event) => {
    const roomKey = String(event.roomId);

    //Add Grouped Events into record
    if (!groupByEvents[roomKey]) groupByEvents[roomKey] = [];
    groupByEvents[roomKey].push(event);

    //Since we are collecting the data already might as well populate the output record
    if (!roomBlocks[roomKey]) {
      roomBlocks[roomKey] = [];
    }
  });

  // Calculate coordinates for each group
  for (const roomKey in groupByEvents) {
    const bucketEvents = groupByEvents[roomKey];

    roomBlocks[roomKey] = buildEventBlocks(bucketEvents, earliestEventHour, latestEventHour);
  }

  return { totalEvents: events.length, hours, roomBlocks: roomBlocks };
}

export function transformToWeekBlocks(
  events: IEvent[],
  earliestEventHour: number,
  latestEventHour: number,
  startDate: Date,
  endDate: Date,
) {
  const hours = Array.from({ length: latestEventHour - earliestEventHour }, (_, i) => i + earliestEventHour);

  const totalDays = daysBetween(endDate, startDate);
  // Step 1: Group events by date ONLY
  const groupByDate: Record<string, IEvent[]> = {};
  const dayBlocks: Record<string, Record<string, IEventBlock[]>> = {};

  Array.from({ length: totalDays }, (_, i) => {
    const dateKey = format(addDays(startDate, i), "yyyy-MM-dd");
    if (!dayBlocks[dateKey]) dayBlocks[dateKey] = {};
  });

  events.forEach((event) => {
    const dateKey = format(event.startDate, "yyyy-MM-dd");

    if (!groupByDate[dateKey]) groupByDate[dateKey] = [];
    groupByDate[dateKey].push(event);
  });

  // Step 2: Build blocks for each date
  for (const dateKey in groupByDate) {
    const dailyEvents = groupByDate[dateKey];

    // --- FIRST PASS: All Rooms (-1) ---
    const allBlocks = buildEventBlocks(dailyEvents, earliestEventHour, latestEventHour);

    dayBlocks[dateKey]["-1"] = allBlocks; // All Rooms option

    // --- SECOND PASS: Individual Rooms ---
    const rooms: Record<string, IEvent[]> = {};

    // Group events by room for this day
    dailyEvents.forEach((event) => {
      const roomKey = String(event.roomId);
      if (!rooms[roomKey]) rooms[roomKey] = [];
      rooms[roomKey].push(event);
    });

    // Build blocks per room
    for (const roomKey in rooms) {
      const roomEvents = rooms[roomKey];

      dayBlocks[dateKey][roomKey] = buildEventBlocks(roomEvents, earliestEventHour, latestEventHour);
    }
  }

  return {
    totalEvents: events.length,
    hours,
    dayBlocks,
    groupingType: "date",
  };
}

function buildEventBlocks(bucketEvents: IEvent[], earliestEventHour: number, latestEventHour: number): IEventBlock[] {
  const partitioned = groupEvents(bucketEvents);

  return partitioned.flatMap((group, groupIndex) =>
    group.map((event, eventIndex) => {
      const hasOverlap = partitioned.some(
        (neighborGroup, neighborIndex) =>
          neighborIndex !== groupIndex &&
          neighborGroup.some((o) =>
            areIntervalsOverlapping(
              { start: event.startDate, end: event.endDate },
              { start: o.startDate, end: o.endDate },
            ),
          ),
      );

      const currentDate = new Date(event.startDate);

      return {
        key: `block-${event.eventId}-${currentDate.getTime()}`,
        groupIndex,
        eventIndex,
        eventStyle: calculateEventBlockStyle(event, currentDate, groupIndex, partitioned.length, hasOverlap, {
          from: earliestEventHour,
          to: latestEventHour,
        }),
        eventHeight: (differenceInMinutes(event.endDate, event.startDate) / 60) * TIME_BLOCK_SIZE - 8,
        event,
        roomId: event.roomId,
      };
    }),
  );
}

/**
 * Strategy for Grid-based views (Month)
 * Returns a record of days, each containing a list of event records with positions
 */
export function transformToGrid(events: IEvent[], selectedDate: Date, multiDayEventsAtTop: boolean) {
  const { startDate, endDate } = getDaysInView(selectedDate);
  const listOfDays = eachDayOfInterval({ start: startDate, end: endDate });

  const eventsByDate: Record<string, IEvent[]> = {};
  const eventByID: Record<number, IEvent[]> = {};

  events.forEach((event) => {
    const dateKey = format(new Date(event.startDate), "yyyy-MM-dd");

    if (!eventsByDate[dateKey]) {
      eventsByDate[dateKey] = [];
    }
    eventsByDate[dateKey].push(event);

    if (event.multiDay) {
      if (!eventByID[event.eventId]) {
        eventByID[event.eventId] = [];
      }
      eventByID[event.eventId].push(event);
    }
  });

  // 1. compute maxEvents

  let maxEvents = 0;
  listOfDays.forEach((day) => {
    const key = format(day, "yyyy-MM-dd");
    const count = eventsByDate[key]?.length || 0;
    if (count > maxEvents) maxEvents = count;
  });

  // 2. initialize eventPositions
  const eventPositions: Record<string, (number | null)[]> = {};
  listOfDays.forEach((day) => {
    const key = format(day, "yyyy-MM-dd");
    eventPositions[key] = Array(maxEvents).fill(null);
  });

  // 3. Pack the events (Mutation logic from your File 3)
  mutateMultiDayEventPositions(eventPositions, eventsByDate, eventByID, multiDayEventsAtTop);
  mutateSingleDayEventPositions(eventPositions, eventsByDate, listOfDays);

  // 4. Map to UI-friendly structure
  const dayViews: IMonthDayView[] = [];
  const weekViews: IMonthWeekView[] = [];

  listOfDays.forEach((date, dayIndex) => {
    const dateKey = format(date, "yyyy-MM-dd");
    const dailyEvents = events.filter((e) => format(e.startDate, "yyyy-MM-dd") === dateKey);

    const eventRecords: IEventView[] = [];

    const slots = eventPositions[dateKey];
    for (let index = 0; index < slots.length; index++) {
      const packedId = slots[index];
      // Skip only true empty slots
      if (packedId === null) continue;
      // packedId may be 0 (blank filler) or an eventId
      const matchingEvent = dailyEvents.find((e) => e.eventId === packedId);
      eventRecords.push({ index, position: matchingEvent?.multiDay?.position ?? "none", event: matchingEvent });
    }

    const totalEventsInDay = slots.filter((id) => id !== null && id !== 0).length;

    const dayView = {
      day: date.getDate(),
      dayDate: date.toISOString() as ISODateString,
      eventRecords,
      totalEvents: totalEventsInDay,
      isToday: isToday(date),
      isSunday: isSunday(date),
      isCurrentMonth: isSameMonth(selectedDate, date),
    };

    dayViews.push(dayView);

    const weekIndex = Math.floor(dayIndex / 7);

    if (!weekViews[weekIndex]) {
      weekViews[weekIndex] = {
        week: weekIndex,
        maxDailyEvents: 0,
        dayViews: [],
      };
    }

    weekViews[weekIndex].dayViews.push(dayView);
  });

  return { totalEvents: events.length, dayViews, weekViews };
}

export function groupEventsByDate(events: IEvent[]): Record<string, IEvent[]> {
  const map: Record<string, IEvent[]> = {};

  events.forEach((event) => {
    const key = format(new Date(event.startDate), "yyyy-MM-dd");
    if (!map[key]) map[key] = [];
    map[key].push(event);
  });

  return map;
}

function mutateMultiDayEventPositions(
  eventPositions: Record<string, (number | null)[]>,
  eventsByDate: Record<string, IEvent[]>,
  eventsByID: Record<number, IEvent[]>,
  multiDayEventsAtTop: boolean = false,
) {
  for (const dateKey in eventsByDate) {
    //GET ALL THE EVENTS FOR THE DAY
    const eventsOnThisDay = eventsByDate[dateKey];

    // Only place multi-day events that start today
    const startingMultiDay = eventsOnThisDay.filter((e) => e.multiDay && e.multiDay.position === "first");

    startingMultiDay.forEach((event) => {
      const currentDaySlots = eventPositions[dateKey];
      //IF THE CURRENT SLOT HAS DATA SKIP
      if (!currentDaySlots) return;

      //LOOK FOR THE FIRST AVAILABLE SLOT
      for (let slotIndex = 0; slotIndex < currentDaySlots.length; slotIndex++) {
        //IF ITS NULL THEN ITS AVAILABLE
        if (currentDaySlots[slotIndex] === null) {
          //GET EACH PORTION OF THE MULTI DAY EVENT
          const seriesParts = eventsByID[event.eventId] || [];
          seriesParts.forEach((part) => {
            const partDateKey = format(new Date(part.startDate), "yyyy-MM-dd");

            if (eventPositions[partDateKey]) {
              //ADD THE EVENTID INTO THAT SLOT IF THE SLOT EXISTS
              eventPositions[partDateKey][slotIndex] = part.eventId;
            }
          });
          // Series placed, move to next multi-day event
          break;
        }
      }
    });
  }

  //IF ALL THE MULTI DAY EVENTS ARE AT THE TOP WE NEED TO ADD IN SOME BLANK VALUES
  //TO ENSURE THAT THE SYSTEM DOESNT INSERT EVENTS
  //WE ALSO THEN NEED TO EXTEND THE EVENTPOSITION ARRAY BECAUSE SOME EVENTS WILL NO LONGER FIT

  if (multiDayEventsAtTop) {
    let maxMultiEventIndex = 0;

    for (const dayKey in eventPositions) {
      const daySlots = eventPositions[dayKey];
      let lastBusyIndex = -1;

      for (let i = 0; i < daySlots.length; i++) {
        if (daySlots[i] !== null) lastBusyIndex = i;
      }

      if (lastBusyIndex > 0) {
        for (let i = 0; i <= lastBusyIndex; i++) {
          if (daySlots[i] === null) daySlots[i] = 0;
        }
      }
      maxMultiEventIndex = Math.max(maxMultiEventIndex, lastBusyIndex);
    }
    for (const dayKey in eventPositions) {
      for (let i = 0; i < maxMultiEventIndex; i++) {
        eventPositions[dayKey].push(null);
      }
    }
  }
}

function mutateSingleDayEventPositions(
  eventPositions: { [key: string]: (number | null)[] },
  eventsByDate: Record<string, IEvent[]>,
  listOfDaysInMonth: Date[],
) {
  listOfDaysInMonth.forEach((currentDate) => {
    const dateString = format(currentDate, "yyyy-MM-dd");
    //GET THE POSITION LIST
    const currentDayPositions = eventPositions[dateString];

    //GET ALL THE EVENTS THAT OCCUR TODAY INCLUDING THE MULTI DAY EVENTS
    const eventsToday = eventsByDate[dateString] || [];

    //ADD ALL THE EVENTS INTO THEIR POSITIONS
    eventsToday.forEach((currentEvent) => {
      //IF THE EVENT ALREADY EXISTS IN THE CURRENT POSITION LIST SKIP IT
      if (currentDayPositions.includes(currentEvent.eventId)) {
        return;
      }

      for (let index = 0; index < currentDayPositions.length; index++) {
        //IF THE POSITION IS EMPTY ADD AN EVENT
        if (currentDayPositions[index] === null) {
          //CHECK IF THE EVENT BEING ADDED IS A MULTI-DAY EVENT
          eventPositions[dateString][index] = currentEvent.eventId;
          return;
        }
      }
    });
  });
}

/**
 * Strategy for Year View
 * Groups events by date and nests them inside a 12-month structure
 */
export function transformToYearly(
  events: IEvent[],
  selectedDate: Date,
): { totalEvents: number; monthViews: IYearMonthView[] } {
  // 1. Group events by date string for O(1) lookup during nesting
  const eventsByDate: Record<string, IEvent[]> = {};

  events.forEach((event) => {
    const key = format(event.startDate, "yyyy-MM-dd");
    if (!eventsByDate[key]) eventsByDate[key] = [];
    eventsByDate[key].push(event);
  });

  // 2. Generate the 12 month objects
  const yearStart = startOfYear(selectedDate);
  const monthData: IYearMonthView[] = Array.from({ length: 12 }, (_, monthIndex) => {
    const monthDate = addMonths(yearStart, monthIndex);
    const monthName = format(monthDate, "MMMM");

    // 3. Generate days including leading blanks for grid alignment
    const totalDays = getDaysInMonth(monthDate);
    const firstDayOffset = startOfMonth(monthDate).getDay(); // 0 for Sunday, etc.

    const days: IYearDayView[] = [];

    // Add blank/padding days
    const blankDay = new Date(0).toISOString() as ISODateString;
    for (let i = 0; i < firstDayOffset; i++) {
      days.push({
        day: -i,
        dayDate: blankDay,
        isBlank: true,
        isToday: false,
        dayEvents: [],
      });
    }

    // Add actual days
    for (let d = 1; d <= totalDays; d++) {
      const date = new Date(monthDate.getFullYear(), monthDate.getMonth(), d);
      const key = format(date, "yyyy-MM-dd");

      days.push({
        day: d,
        dayDate: date.toISOString() as ISODateString,
        isBlank: false,
        isToday: isToday(date),
        dayEvents: eventsByDate[key] || [],
      });
    }

    return {
      month: monthIndex,
      monthDate: monthDate.toISOString() as ISODateString,
      monthName,
      days,
    };
  });

  return { totalEvents: events.length, monthViews: monthData };
}

export function filterEventsByRoom(events: IEvent[], selectedRoomId: string[] | string) {
  const roomIds = Array.isArray(selectedRoomId) ? selectedRoomId : [selectedRoomId];

  if (roomIds.includes("-1")) {
    return events;
  }

  const results = events.filter((event) => {
    return roomIds.includes(event.roomId.toString());
  });

  return results;
}

export function filterEventsByStatus(events: IEvent[], exlcudeStatusKeys: TStatusKey[]) {
  const results = events.filter((event) => {
    return !exlcudeStatusKeys.includes(event.status.key as TStatusKey);
  });

  return results;
}

function getDaysInView(selectedDate: Date) {
  const daysInMonth = getDaysInMonth(selectedDate);
  const firstDayOfMonth = startOfMonth(selectedDate);
  const beforeDays = firstDayOfMonth.getDay();

  const daysInLastRow = (daysInMonth + beforeDays) % 7;
  const afterDays = daysInLastRow > 0 ? 7 - daysInLastRow : 0;
  const firstDate = startOfDay(subDays(firstDayOfMonth, beforeDays));
  const lastDate = endOfDay(addDays(firstDayOfMonth, daysInMonth + afterDays - 1));

  return { startDate: firstDate, endDate: lastDate };
}

function getVisibleHours(visibleHours: TVisibleHours, singleDayEvents: IEvent[]) {
  let earliestEventHour = visibleHours.from;
  let latestEventHour = visibleHours.to;

  singleDayEvents.forEach((event) => {
    const startHour = new Date(event.startDate).getHours();
    const endTime = new Date(event.endDate);
    const endHour = endTime.getHours() + (endTime.getMinutes() > 0 ? 1 : 0);
    if (startHour < earliestEventHour) earliestEventHour = startHour;
    if (endHour > latestEventHour) latestEventHour = endHour;
  });

  latestEventHour = Math.min(latestEventHour, 24);

  const hours = Array.from({ length: latestEventHour - earliestEventHour }, (_, i) => i + earliestEventHour);

  return { hours, earliestEventHour, latestEventHour };
}

function groupEvents(dayEvents: IEvent[]) {
  const sortedEvents = dayEvents.sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
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

function roundToPrecision(value: number, precision: number) {
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

export function getDateRange(action: CalendarAction, date: Date) {
  switch (action) {
    case "WEEK":
      return { startDate: startOfWeek(date), endDate: endOfWeek(date) };
    case "MONTH":
      return getDaysInView(date); // Using your helper
    case "YEAR":
      return { startDate: startOfYear(date), endDate: endOfYear(date) };
    case "DAY":
    default:
      return { startDate: startOfDay(date), endDate: endOfDay(date) };
  }
}

function calculateEventBlockStyle(
  event: IEvent,
  day: Date,
  groupIndex: number,
  groupSize: number,
  hasOverlap: boolean,
  visibleHoursRange?: { from: number; to: number },
) {
  const startDate = new Date(event.startDate);
  const dayStart = new Date(day.setHours(0, 0, 0, 0));
  const eventStart = startDate < dayStart ? dayStart : startDate;
  const startMinutes = eventStart.getHours() * 60 + eventStart.getMinutes();

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

function isSingleAllDayEvent(startDate: Date, endDate: Date): boolean {
  const startMidnight = startOfDay(startDate);
  const endMidnight = startOfDay(endDate);

  //Check if both dates are exactly at Midnight (00:00:00.000)
  const startsAtMidnight = startDate.getTime() === startMidnight.getTime();
  const endsAtMidnight = endDate.getTime() === endMidnight.getTime();

  if (!startsAtMidnight || !endsAtMidnight) return false;

  //DST causes a problem if comparing exactly 24 hours.
  //So instead we look for the next midnight based on the start date
  //and check if they match
  const nextMidnight = addDays(startMidnight, 1);

  return endMidnight.getTime() === nextMidnight.getTime();
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

    if (isSingleAllDayEvent(new Date(currentStartDate), new Date(currentEndDate))) {
      if (isWithinInterval(currentStartDate, { start: periodStart, end: periodEnd })) {
        eventList.push(event);
      }
      continue;
    }

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
        newEvent.multiDay = { position: "first", calculatedDate: currentStartDate };
      } else if (dayIndex === totalDaysBetween) {
        //LAST DAY
        newEvent.startDate = set(currentEndDate, {
          hours: minStartTime,
          minutes: 0,
          seconds: 0,
          milliseconds: 0,
        }).toISOString();

        newEvent.multiDay = { position: "last", calculatedDate: currentEndDate };
      } else {
        newEvent.startDate = set(newDay, {
          hours: minStartTime,
          minutes: 0,
          seconds: 0,
          milliseconds: 0,
        }).toISOString();
        newEvent.endDate = set(newDay, { hours: maxEndTime, minutes: 0, seconds: 0, milliseconds: 0 }).toISOString();
        newEvent.multiDay = { position: "middle", calculatedDate: newDay.toISOString() };
        //MIDDLE DAY
      }
      eventList.push(newEvent);
    }
  }
  return eventList;
}

export function calculateMultiDayEventPositions(events: IEvent[], periodStart: Date, periodEnd: Date) {
  const eventList: IEvent[] = [];

  for (const event of events) {
    if (event.recurrenceId !== null) continue;

    const currentStartDate = event.startDate;
    const currentEndDate = event.endDate;

    if (isSingleAllDayEvent(new Date(currentStartDate), new Date(currentEndDate))) {
      if (isWithinInterval(currentStartDate, { start: periodStart, end: periodEnd })) {
        eventList.push({ ...event, multiDay: { position: "single", calculatedDate: currentStartDate } });
      }
      continue;
    }

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
        //eventIsSplit: true,
        title: `Day ${dayIndex + 1} of ${totalDaysBetween + 1}` + (event.title ? " - " + event.title : ""),
      };

      if (dayIndex === 0) {
        //First Day

        newEvent.multiDay = { position: "first", calculatedDate: currentStartDate };
      } else if (dayIndex === totalDaysBetween) {
        //LAST DAY
        newEvent.multiDay = { position: "last", calculatedDate: currentEndDate };
      } else {
        //MIDDLE DAY
        newEvent.multiDay = { position: "middle", calculatedDate: newDay.toISOString() };
      }
      eventList.push(newEvent);
    }
  }
  return eventList;
}

export function setMultiDayEventBoundaries(events: IEvent[], minHour: number, maxHour: number) {
  const eventList: IEvent[] = [];

  const multiDayEvents = events.filter((event) => event.multiDay);

  for (const event of multiDayEvents) {
    switch (event.multiDay?.position) {
      case "first":
        event.endDate = set(event.multiDay.calculatedDate, {
          hours: maxHour,
          minutes: 0,
          seconds: 0,
          milliseconds: 0,
        }).toISOString();
        break;
      case "middle":
        event.startDate = set(event.multiDay.calculatedDate, {
          hours: minHour,
          minutes: 0,
          seconds: 0,
          milliseconds: 0,
        }).toISOString();
        event.endDate = set(event.multiDay.calculatedDate, {
          hours: maxHour,
          minutes: 0,
          seconds: 0,
          milliseconds: 0,
        }).toISOString();
        break;
      case "last":
        event.startDate = set(event.multiDay.calculatedDate, {
          hours: minHour,
          minutes: 0,
          seconds: 0,
          milliseconds: 0,
        }).toISOString();

        break;
    }
  }
}

export function generateRecurringEventsInPeriod(events: IEvent[], periodStart: Date, periodEnd: Date) {
  const eventList: IEvent[] = [];

  const startUTC = setPartsToUTCDate(periodStart);
  const endUTC = setPartsToUTCDate(periodEnd);

  for (const event of events) {
    if (!event.recurrenceId || !event.recurrence?.rule) continue;

    const rrule = rrulestr(event.recurrence.rule, { cache: true });

    const recurrenceDates = rrule.between(startUTC, endUTC, true);

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

function setUTCPartsToDate(d: Date) {
  return new Date(
    d.getUTCFullYear(),
    d.getUTCMonth(),
    d.getUTCDate(),
    d.getUTCHours(),
    d.getUTCMinutes(),
    d.getUTCSeconds(),
  );
}

function setPartsToUTCDate(d: Date) {
  return new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate(), d.getHours(), d.getMinutes(), d.getSeconds()));
}
