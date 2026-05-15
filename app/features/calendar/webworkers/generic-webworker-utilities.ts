import { IEvent, IEventSingleRoom } from '@/lib/schemas';
import { TColors, TIME_BLOCK_SIZE, TStatusKey, TVisibleHours } from '@/lib/types';
import {
  addDays,
  addMonths,
  areIntervalsOverlapping,
  differenceInDays,
  eachDayOfInterval,
  endOfDay,
  endOfMonth,
  endOfWeek,
  endOfYear,
  format,
  getDaysInMonth,
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
  subMinutes,
} from 'date-fns';

import { rrulestr } from 'rrule';
import {
  CalendarAction,
  IRequestGroup,
  IEventBlock,
  IEventView,
  IMonthDayView,
  IMonthWeekView,
  IRequestSection,
  ISODateString,
  IYearDayView,
  IYearMonthView,
} from './generic-webworker';
import { daysBetween } from 'rrule/dist/esm/dateutil';

export function calculateViewBoundaries(config: TVisibleHours, events: IEventSingleRoom[], viewStart: Date, viewEnd: Date) {
  let minHour = config.from;
  let maxHour = config.to;

  const multiDayEvents = events.filter((e) => e.multiDay);
  const otherEvents = events.filter((e) => !e.multiDay);

  // STEP 1: Process all non-multi-day events to establish base bounds
  otherEvents.forEach((event) => {
    const startHour = new Date(event.startDate).getHours();
    const endDate = new Date(event.endDate);
    let endHour = endDate.getHours();
    const endMinutes = endDate.getMinutes();
    if (endMinutes > 0) endHour += 1;

    // Expand minHour if needed
    if (startHour < minHour) minHour = startHour;

    // Expand maxHour if needed
    if (endHour > maxHour) maxHour = Math.min(endHour, 24);

    // The Step-Back Rule: if event ends early (e.g., 2 AM), ensure we show the hour before
    if (endHour > 0 && endHour <= minHour) {
      const neededStart = endHour - 1;
      minHour = Math.max(0, neededStart);
    }
  });

  // STEP 2: Process multi-day events using the bounds established by otherEvents
  multiDayEvents.forEach((event) => {
    const position = event.multiDay?.position;
    const isEndAtMidnight = event.multiDay?.isEndAtMidnight || false;
    const dateToProcess = event.multiDay?.calculatedDate ? new Date(event.multiDay.calculatedDate) : null;

    // --- START BOUNDARY (minHour) ---
    // Only the 'first' day of a multi-day event can shrink the minHour via its start time
    if (position === 'first' && dateToProcess) {
      const startHour = dateToProcess.getHours();
      const startMinutes = dateToProcess.getMinutes();
      const visualStartHour = startHour + (startMinutes > 0 ? 1 : 0);
      if (startHour < minHour) minHour = startHour;
      if (visualStartHour > maxHour) maxHour = visualStartHour;
      // The Step-Forward Rule:
      if (startHour >= maxHour && startHour < 24) {
        maxHour = Math.min(24, startHour + 1);
      }
    }

    if (position === 'last' && dateToProcess) {
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

    // Full day for single all-day events
    if (position === 'single') {
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
  events: IEventSingleRoom[],
  earliestEventHour: number,
  latestEventHour: number,
): { totalEvents: number; hours: number[]; roomBlocks: Record<string, IEventBlock[]> } {
  const hours = Array.from({ length: latestEventHour - earliestEventHour }, (_, i) => i + earliestEventHour);

  const groupByEvents: Record<string, IEventSingleRoom[]> = {};
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
  events: IEventSingleRoom[],
  earliestEventHour: number,
  latestEventHour: number,
  startDate: Date,
  endDate: Date,
) {
  const hours = Array.from({ length: latestEventHour - earliestEventHour }, (_, i) => i + earliestEventHour);

  const totalDays = daysBetween(endDate, startDate);
  // Step 1: Group events by date ONLY
  const groupByDate: Record<string, IEventSingleRoom[]> = {};
  const dayBlocks: Record<string, IEventBlock[]> = {};

  Array.from({ length: totalDays }, (_, i) => {
    const dateKey = format(addDays(startDate, i), 'yyyy-MM-dd');
    if (!dayBlocks[dateKey]) dayBlocks[dateKey] = [];
  });

  events.forEach((event) => {
    const dateKey = format(event.startDate, 'yyyy-MM-dd');

    if (!groupByDate[dateKey]) groupByDate[dateKey] = [];
    groupByDate[dateKey].push(event);
  });

  // Step 2: Build blocks for each date
  for (const dateKey in groupByDate) {
    const dailyEvents = groupByDate[dateKey];

    dayBlocks[dateKey] = buildEventBlocks(dailyEvents, earliestEventHour, latestEventHour);
  }

  return {
    totalEvents: events.length,
    hours,
    dayBlocks,
    groupingType: 'date',
  };
}

export function transformToBlocksByDayByRoom(
  events: IEventSingleRoom[],
  earliestEventHour: number,
  latestEventHour: number,
  startDate: Date,
  endDate: Date,
) {
  const hours = Array.from({ length: latestEventHour - earliestEventHour }, (_, i) => i + earliestEventHour);

  const totalDays = daysBetween(endDate, startDate);
  // Step 1: Group events by date ONLY
  const groupByDate: Record<string, IEventSingleRoom[]> = {};
  const dayBlocks: Record<string, Record<string, IEventBlock[]>> = {};

  Array.from({ length: totalDays }, (_, i) => {
    const dateKey = format(addDays(startDate, i), 'yyyy-MM-dd');
    if (!dayBlocks[dateKey]) dayBlocks[dateKey] = {};
  });

  events.forEach((event) => {
    const dateKey = format(event.startDate, 'yyyy-MM-dd');

    if (!groupByDate[dateKey]) groupByDate[dateKey] = [];
    groupByDate[dateKey].push(event);
  });

  // Step 2: Build blocks for each date
  for (const dateKey in groupByDate) {
    const dailyEvents = groupByDate[dateKey];

    // --- FIRST PASS: All Rooms (-1) ---
    const allBlocks = buildEventBlocks(dailyEvents, earliestEventHour, latestEventHour);

    dayBlocks[dateKey]['-1'] = allBlocks; // All Rooms option

    // --- SECOND PASS: Individual Rooms ---
    const rooms: Record<string, IEventSingleRoom[]> = {};

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
    groupingType: 'date',
  };
}

function buildEventBlocks(bucketEvents: IEventSingleRoom[], earliestEventHour: number, latestEventHour: number): IEventBlock[] {
  const partitioned = groupEvents(bucketEvents);

  return partitioned.flatMap((group, groupIndex) =>
    group.map((event, eventIndex) => {
      const hasOverlap = partitioned.some(
        (neighborGroup, neighborIndex) =>
          neighborIndex !== groupIndex &&
          neighborGroup.some((o) => {
            return areIntervalsOverlapping({ start: event.startDate, end: event.endDate }, { start: o.startDate, end: o.endDate });
          }),
      );

      const currentDate = new Date(event.startDate);
      const { startMinutes, endMinutes } = getEventVisualRange(event, currentDate);

      return {
        key: `block-${event.eventId}-${currentDate.getTime()}-${event.roomId}`,
        groupIndex,
        eventIndex,
        eventStyle: calculateEventBlockStyle(event, currentDate, groupIndex, partitioned.length, hasOverlap, {
          from: earliestEventHour,
          to: latestEventHour,
        }),
        eventHeight: ((endMinutes - startMinutes) / 60) * TIME_BLOCK_SIZE - 8,
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
export function transformToGrid(events: IEventSingleRoom[], selectedDate: Date, multiDayEventsAtTop: boolean) {
  const { startDate, endDate } = getDaysInView(selectedDate);
  const listOfDays = eachDayOfInterval({ start: startDate, end: endDate });

  const eventsByDate: Record<string, IEventSingleRoom[]> = {};
  const eventByID: Record<number, IEventSingleRoom[]> = {};

  events.forEach((event) => {
    const dateKey = format(new Date(event.startDate), 'yyyy-MM-dd');

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
    const key = format(day, 'yyyy-MM-dd');
    const count = eventsByDate[key]?.length || 0;
    if (count > maxEvents) maxEvents = count;
  });

  // 2. initialize eventPositions
  const eventPositions: Record<string, (number | null)[]> = {};
  listOfDays.forEach((day) => {
    const key = format(day, 'yyyy-MM-dd');
    eventPositions[key] = Array(maxEvents).fill(null);
  });

  // 3. Pack the events (Mutation logic from your File 3)
  mutateMultiDayEventPositions(eventPositions, eventsByDate, eventByID, multiDayEventsAtTop);
  mutateSingleDayEventPositions(eventPositions, eventsByDate, listOfDays);

  // 4. Map to UI-friendly structure
  const dayViews: IMonthDayView[] = [];
  const weekViews: IMonthWeekView[] = [];

  listOfDays.forEach((date, dayIndex) => {
    const dateKey = format(date, 'yyyy-MM-dd');
    const dailyEvents = events.filter((e) => format(e.startDate, 'yyyy-MM-dd') === dateKey);

    const eventRecords: IEventView[] = [];

    const slots = eventPositions[dateKey];
    for (let index = 0; index < slots.length; index++) {
      const packedId = slots[index];
      // Skip only true empty slots
      if (packedId === null) continue;
      // packedId may be 0 (blank filler) or an eventId
      const matchingEvent = dailyEvents.find((e) => e.eventId === packedId);
      eventRecords.push({ index, position: matchingEvent?.multiDay?.position ?? 'none', event: matchingEvent });
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

export function groupEventsByDate(events: IEventSingleRoom[]): Record<string, IEventSingleRoom[]> {
  const map: Record<string, IEventSingleRoom[]> = {};

  events.forEach((event) => {
    const key = format(new Date(event.startDate), 'yyyy-MM-dd');
    if (!map[key]) map[key] = [];
    map[key].push(event);
  });

  return map;
}

function mutateMultiDayEventPositions(
  eventPositions: Record<string, (number | null)[]>,
  eventsByDate: Record<string, IEventSingleRoom[]>,
  eventsByID: Record<number, IEventSingleRoom[]>,
  multiDayEventsAtTop: boolean = false,
) {
  const keys = Object.keys(eventsByDate);

  for (const dateKey in eventsByDate) {
    const firstKey = keys[0];

    const isFirstInstanceinMonth = firstKey === dateKey;

    //GET ALL THE EVENTS FOR THE DAY
    const eventsOnThisDay = eventsByDate[dateKey];

    // Only place multi-day events that start today
    // We need to verify if this is also the first day or first iteration
    // Multi Day events that cross between months need to stay ordered by position
    // without the firstInstance check it will try and fit them in at random which is wrong.
    const startingMultiDay = eventsOnThisDay.filter((e) => e.multiDay && (e.multiDay.position === 'first' || isFirstInstanceinMonth));

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
            const partDateKey = format(new Date(part.startDate), 'yyyy-MM-dd');

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
  eventsByDate: Record<string, IEventSingleRoom[]>,
  listOfDaysInMonth: Date[],
) {
  listOfDaysInMonth.forEach((currentDate) => {
    const dateString = format(currentDate, 'yyyy-MM-dd');
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
export function transformToYearly(events: IEventSingleRoom[], selectedDate: Date): { totalEvents: number; monthViews: IYearMonthView[] } {
  // 1. Group events by date string for O(1) lookup during nesting
  const eventsByDate: Record<string, IEventSingleRoom[]> = {};

  events.forEach((event) => {
    const key = format(event.startDate, 'yyyy-MM-dd');
    if (!eventsByDate[key]) eventsByDate[key] = [];
    eventsByDate[key].push(event);
  });

  // 2. Generate the 12 month objects
  const yearStart = startOfYear(selectedDate);
  const monthData: IYearMonthView[] = Array.from({ length: 12 }, (_, monthIndex) => {
    const monthDate = addMonths(yearStart, monthIndex);
    const monthName = format(monthDate, 'MMMM');

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
      const key = format(date, 'yyyy-MM-dd');

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

export function filterEventsByRoom(events: IEventSingleRoom[], selectedRoomId: string[]) {
  if (selectedRoomId.includes('-1')) {
    return events;
  }

  const results = events.filter((event) => {
    return selectedRoomId.includes(event.roomId.toString());
  });

  return results;
}

export function filterEventsByStatus(events: IEventSingleRoom[], statusKeys: TStatusKey[]) {
  if (statusKeys.length === 0) return events;

  const results = events.filter((event) => {
    return statusKeys.includes(event.status.key as TStatusKey);
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

function getVisibleHours(visibleHours: TVisibleHours, singleDayEvents: IEventSingleRoom[]) {
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

function groupEvents(dayEvents: IEventSingleRoom[]) {
  const sortedEvents = dayEvents.sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
  const groups: IEventSingleRoom[][] = [];

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
        return '0';
      }),
  ].join('');

  const adjustment = Number('1' + padding);
  return Math.round(value * adjustment) / adjustment;
}

export function getDateRange(action: CalendarAction, date: Date, viewType: 'calendar' | 'booking') {
  switch (action) {
    case 'WEEK':
      return { startDate: startOfWeek(date), endDate: endOfWeek(date) };
    case 'MONTH':
      return viewType === 'calendar' ? getDaysInView(date) : { startDate: startOfMonth(date), endDate: endOfMonth(date) };
    case 'YEAR':
      return { startDate: startOfYear(date), endDate: endOfYear(date) };
    case 'DAY':
    default:
      return { startDate: startOfDay(date), endDate: endOfDay(date) };
  }
}

function calculateEventBlockStyle(
  event: IEventSingleRoom,
  day: Date,
  groupIndex: number,
  groupSize: number,
  hasOverlap: boolean,
  visibleHoursRange: { from: number; to: number },
) {
  const { startMinutes, endMinutes } = getEventVisualRange(event, day);

  const visibleStartMin = visibleHoursRange.from * 60;
  const visibleEndMin = visibleHoursRange.to * 60;
  const totalVisibleMin = visibleEndMin - visibleStartMin;

  const clampedStart = Math.max(visibleStartMin, startMinutes);
  const clampedEnd = Math.min(visibleEndMin, endMinutes);

  const top = ((clampedStart - visibleStartMin) / totalVisibleMin) * 100;
  const height = ((clampedEnd - clampedStart) / totalVisibleMin) * 100;

  const width = hasOverlap ? 100 / groupSize : 100;
  const left = hasOverlap ? groupIndex * width : 0;

  return {
    top: `${roundToPrecision(top, 2)}%`,
    height: `${roundToPrecision(height, 2)}%`,
    width: `${roundToPrecision(width, 2)}%`,
    left: `${roundToPrecision(left, 2)}%`,
    position: 'absolute',
  };
}

function getEventVisualRange(event: IEventSingleRoom, day: Date) {
  const startDate = new Date(event.startDate);
  const endDate = new Date(event.endDate);

  // Default: Event spans the whole day (Middle day logic)
  let startMinutes = 0;
  let endMinutes = 1440;

  // If it starts today, use actual start time
  if (isSameDay(startDate, day)) {
    startMinutes = startDate.getHours() * 60 + startDate.getMinutes();
  }

  // If it ends today, use actual end time
  if (isSameDay(endDate, day)) {
    const endMins = endDate.getHours() * 60 + endDate.getMinutes();
    // Handle Midnight (00:00) as the end of the current day (1440)
    endMinutes = endMins === 0 && endDate.getHours() === 0 ? 1440 : endMins;
  }

  return { startMinutes, endMinutes };
}

function getWallClockMinutes(date: Date): number {
  // This ignores DST and just looks at what the "clock on the wall" says
  return date.getHours() * 60 + date.getMinutes();
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

function isSingleDayEventEndAtMidnight(startDate: Date, endDate: Date): boolean {
  const total = differenceInDays(endDate, startDate);

  if (isMidnight(new Date(endDate)) && total === 0) {
    return true;
  } else {
    return false;
  }
}

export function calculateMultiDayEventPositions(events: IEvent[], periodStart: Date, periodEnd: Date) {
  const eventList: IEvent[] = [];

  for (const event of events) {
    if (event.recurrenceId !== null) continue;

    const currentStartDate = new Date(event.startDate);
    const currentEndDate = new Date(event.endDate);

    // Check if this event ends at midnight
    const endAtMidnight = endsAtMidnight(currentStartDate, currentEndDate);

    // Adjust end date for calculation purposes if it's at midnight
    const adjustedEndDate = endAtMidnight ? getAdjustedEndDateForMultiDay(currentEndDate) : currentEndDate;

    // Handle all-day events
    if (isSingleAllDayEvent(currentStartDate, currentEndDate)) {
      if (isWithinInterval(currentStartDate, { start: periodStart, end: periodEnd })) {
        eventList.push({
          ...event,
          multiDay: {
            position: 'single',
            description: `All Day`,
            calculatedDate: currentStartDate.toISOString(),
            isEndAtMidnight: endAtMidnight,
            originalEndDate: currentEndDate.toISOString(),
          },
        });
      }
      continue;
    }

    // Handle events ending at midnight on same day
    if (isSingleDayEventEndAtMidnight(currentStartDate, currentEndDate)) {
      if (isWithinInterval(currentStartDate, { start: periodStart, end: periodEnd })) {
        eventList.push({
          ...event,
          multiDay: {
            position: 'single',
            description: `All Day`,
            calculatedDate: currentStartDate.toISOString(),
            isEndAtMidnight: true,
            originalEndDate: currentEndDate.toISOString(),
          },
        });
      }
      continue;
    }

    // Calculate total days between (using adjusted end date for midnight events)
    const totalDaysBetween = differenceInDays(endOfDay(adjustedEndDate), startOfDay(currentStartDate));

    // Single-day events that don't end at midnight
    if (totalDaysBetween === 0) {
      eventList.push({
        ...event,
        multiDay: undefined,
      });
      continue;
    }

    // Multi-day events: split into segments
    for (let dayIndex = 0; dayIndex <= totalDaysBetween; dayIndex++) {
      const newDay = set(addDays(currentStartDate, dayIndex), { hours: 0, minutes: 0, seconds: 0, milliseconds: 0 });

      if (!isWithinInterval(newDay, { start: periodStart, end: periodEnd })) {
        continue;
      }

      const newEvent = {
        ...event,
      };

      let position: 'first' | 'middle' | 'last';
      let calculatedDate: string;

      if (dayIndex === 0) {
        // First segment
        position = 'first';
        calculatedDate = currentStartDate.toISOString();
      } else if (dayIndex === totalDaysBetween) {
        // Last segment: use adjusted date if midnight
        position = 'last';
        calculatedDate = endAtMidnight ? getAdjustedEndDateForMultiDay(currentEndDate).toISOString() : currentEndDate.toISOString();
      } else {
        // Middle segments
        position = 'middle';
        calculatedDate = newDay.toISOString();
      }

      newEvent.multiDay = {
        position,
        description: `Day ${dayIndex + 1} of ${totalDaysBetween + 1}`,
        calculatedDate,
        isEndAtMidnight: endAtMidnight && dayIndex === totalDaysBetween,
        originalEndDate: endAtMidnight ? currentEndDate.toISOString() : undefined,
      };

      eventList.push(newEvent);
    }
  }

  return eventList;
}

export function processMultiRoomEvents(events: IEvent[], splitMultiRoomEvents: boolean, selectedRoomIds: string[] | string): IEventSingleRoom[] {
  const splitEvents: IEventSingleRoom[] = [];
  events.forEach((event) => {
    if (splitMultiRoomEvents) {
      event.eventRooms.map((room) => {
        splitEvents.push({
          ...event,
          roomId: room.roomId,
          roomColor: room.color,
          roomIcon: room.icon,
          roomName: room.name,
          multiRoom: event.eventRooms.length > 1,
        });
      });
    } else {
      const room = event.eventRooms.find((room) => selectedRoomIds.includes(String(room.roomId)));
      splitEvents.push({
        ...event,
        roomId: room?.roomId ?? -2,
        roomColor: room?.color ?? 'zinc',
        roomIcon: room?.icon ?? 'bug',
        roomName: room?.name ?? 'error',
        multiRoom: event.eventRooms.length > 1,
      });
    }
  });
  return splitEvents;
}

export function processRequestEvents(events: IEventSingleRoom[]): IRequestSection[] {
  // Step 1: Group by date and room
  const dateMap = events.reduce((accumulator, event) => {
    const dateKey = format(event.startDate, 'yyyy-MM-dd');
    const roomId = String(event.multiRoom ? 0 : event.roomId);

    if (!accumulator.has(dateKey)) {
      accumulator.set(dateKey, new Map<string, IRequestGroup>());
    }

    const requestSections = accumulator.get(dateKey)!;

    if (requestSections.has(roomId)) {
      requestSections.get(roomId)!.groupEvents.push(event);
    } else {
      requestSections.set(roomId, {
        groupKey: `section[${dateKey}]:room[${roomId}]`,
        groupRoomId: roomId,
        groupName: event.multiRoom ? 'Multiple Rooms' : event.roomName,
        groupColor: event.multiRoom ? 'zinc' : (event.roomColor as TColors),
        groupEvents: [event],
      });
    }

    return accumulator;
  }, new Map<string, Map<string, IRequestGroup>>());

  const result: IRequestSection[] = Array.from(dateMap.entries())
    .sort((a, b) => b[0].localeCompare(a[0])) // Sort dates descending
    .map(([dateKey, groupsMap], index) => {
      const sortedGroups = Array.from(groupsMap.values())
        .map((group) => ({
          ...group,

          groupEvents: group.groupEvents.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()),
        }))
        .sort((a, b) => a.groupName.localeCompare(b.groupName));

      return {
        sectionKey: `section[${dateKey}]`,
        sectionDate: dateKey,
        sectionTitle: format(new Date(dateKey + 'T00:00:00'), 'PPP'),
        sectionGroups: sortedGroups,
      };
    });

  return result;
}

function isMidnight(date: Date) {
  return date.getHours() === 0 && date.getMinutes() === 0 && date.getSeconds() === 0 && date.getMilliseconds() === 0;
}

/**
 * Checks if an event ends exactly at midnight (00:00:00 on the next day).
 * For display purposes, midnight should be treated as 11:59:59 on the previous day.
 */
function endsAtMidnight(startDate: Date, endDate: Date): boolean {
  const start = new Date(startDate);
  const end = new Date(endDate);

  // Check if end time is exactly midnight
  if (!isMidnight(end)) return false;

  // Make sure there's an actual span (not same time)
  return start.getTime() !== end.getTime();
}

/**
 * Calculates the actual end date for multi-day events that end at midnight.
 * Returns the previous day since midnight display should be on the "last" day, not next day.
 */
function getAdjustedEndDateForMultiDay(originalEndDate: Date): Date {
  const end = new Date(originalEndDate);

  if (isMidnight(end)) {
    // Subtract 1 millisecond to land at 11:59:59.999 of the previous day
    return subMinutes(end, 1);
  }

  return end;
}

/**
 * Determines the display hours for a multi-day event segment
 */
function getDisplayHoursForSegment(
  position: 'first' | 'middle' | 'last' | 'single',
  event: IEventSingleRoom,
  minHour: number,
  maxHour: number,
  isEndAtMidnight: boolean,
): { displayStartHour: number; displayEndHour: number } {
  switch (position) {
    case 'first':
      return { displayStartHour: minHour, displayEndHour: maxHour };
    case 'middle':
      return { displayStartHour: minHour, displayEndHour: maxHour };
    case 'last':
      // If ends at midnight, cap at previous day's max hour
      const effectiveEndHour = isEndAtMidnight ? 24 : maxHour;
      return { displayStartHour: minHour, displayEndHour: effectiveEndHour };
    case 'single':
      return { displayStartHour: minHour, displayEndHour: maxHour };
    default:
      return { displayStartHour: minHour, displayEndHour: maxHour };
  }
}

export function setMultiDayEventBoundaries(events: IEvent[], minHour: number, maxHour: number) {
  return events.map((event) => {
    if (!event.multiDay) {
      return event;
    }

    const referenceDate = new Date(event.multiDay.calculatedDate);

    const getWallDate = (h: number) => {
      const d = new Date(referenceDate);
      d.setHours(h, 0, 0, 0);
      return d;
    };

    const startBoundary = getWallDate(minHour);
    const endBoundary = getWallDate(maxHour);

    //const startBoundary = set(referenceDate, { hours: minHour, minutes: 0, seconds: 0, milliseconds: 0 });
    //const endBoundary = set(referenceDate, { hours: maxHour, minutes: 0, seconds: 0, milliseconds: 0 });

    //const offsetDiff = startBoundary.getTimezoneOffset() - endBoundary.getTimezoneOffset();
    const updatedEvent = { ...event };

    switch (event.multiDay?.position) {
      case 'first':
        updatedEvent.endDate = endBoundary.toISOString();
        break;
      case 'middle':
        updatedEvent.startDate = startBoundary.toISOString();
        updatedEvent.endDate = endBoundary.toISOString();
        //event.endDate = addMinutes(endBoundary, offsetDiff).toISOString();
        break;
      case 'last':
        updatedEvent.startDate = startBoundary.toISOString();

        break;
      case 'single':
        // For all-day singles, just ensure they cover the full range
        updatedEvent.startDate = getWallDate(0).toISOString();
        updatedEvent.endDate = getWallDate(24).toISOString();
        break;
    }

    return updatedEvent;
  });
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
        startDate: set(event.startDate, { year, month, date }).toISOString(),
        endDate: set(event.endDate, { year, month, date }).toISOString(),
      });
    }
  }
  return eventList;
}

function setUTCPartsToDate(d: Date) {
  return new Date(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), d.getUTCHours(), d.getUTCMinutes(), d.getUTCSeconds());
}

function setPartsToUTCDate(d: Date) {
  return new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate(), d.getHours(), d.getMinutes(), d.getSeconds()));
}
