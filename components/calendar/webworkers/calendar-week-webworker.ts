/// <reference lib="webworker" />
import { IEvent, SEvent } from "@/lib/schemas/calendar";

import { z } from "zod/v4";

import { calculateEventBlockStyle, filterEventsByRoom, getVisibleHours, groupEvents } from "../../../lib/helpers";
import { IDayView, IEventBlock, IWeekProcessData, IWeekResponseData } from "../calendar-week-view";
import {
  addDays,
  areIntervalsOverlapping,
  differenceInMinutes,
  endOfWeek,
  format,
  isSameDay,
  isToday,
  startOfWeek,
} from "date-fns";
import { generateMultiDayEventsInPeriod, generateRecurringEventsInPeriod } from "@/lib/event-helpers";
//event: MessageEvent<IWeekProcessData>
self.onmessage = async (event) => {
  if (event.data) {
    const buffer = event.data;
    const decoder = new TextDecoder();
    const json = decoder.decode(buffer);
    const data = JSON.parse(json);

    //const result = processWeekEvents(event.data);
    const result = await processWeekEvents_2(data);

    const encoder = new TextEncoder();
    const resultBuffer = encoder.encode(JSON.stringify(result)).buffer;

    self.postMessage(resultBuffer, [resultBuffer]);
  }
};

function processWeekEvents(weekData: IWeekProcessData): IWeekResponseData {
  console.time("processWeekEvents");
  const weekStart: Date = startOfWeek(weekData.selectedDate);
  const weekEnd: Date = endOfWeek(weekData.selectedDate);

  const combinedEvents: IEvent[] = [
    ...generateMultiDayEventsInPeriod(weekData.events, weekStart, weekEnd, { from: 0, to: 24 }),
    ...generateRecurringEventsInPeriod(weekData.events, weekStart, weekEnd),
  ];

  const events = z.array(SEvent).parse(combinedEvents);

  const filteredEvents: IEvent[] = filterEventsByRoom(events, weekData.selectedRoomId);

  filteredEvents.sort((a, b) => a.startDate.getTime() - b.startDate.getTime());

  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const { hours, earliestEventHour, latestEventHour } = getVisibleHours(weekData.visibleHours, filteredEvents);

  const dayViews: IDayView[] = [];

  weekDays.forEach((currentDate) => {
    const eventBlocks: IEventBlock[] = [];

    const dailyEvents = filteredEvents.filter((event) => isSameDay(event.startDate, currentDate));

    const groupedEvents = groupEvents(dailyEvents);

    groupedEvents.forEach((currentGroup, groupIndex) => {
      currentGroup.forEach((currentEvent, eventIndex) => {
        const hasOverlap = groupedEvents.some(
          (otherGroup, otherIndex) =>
            otherIndex !== groupIndex &&
            otherGroup.some((otherEvent) =>
              areIntervalsOverlapping(
                {
                  start: currentEvent.startDate,
                  end: currentEvent.endDate,
                },
                {
                  start: otherEvent.startDate,
                  end: otherEvent.endDate,
                }
              )
            )
        );

        const blockStyle = calculateEventBlockStyle(
          currentEvent,
          currentDate,
          groupIndex,
          groupedEvents.length,
          hasOverlap,
          {
            from: earliestEventHour,
            to: latestEventHour,
          }
        );

        const durationInMinutes = differenceInMinutes(currentEvent.endDate, currentEvent.startDate);
        const heightInPixels = (durationInMinutes / 60) * weekData.pixelHeight - 8;

        const newBlock: IEventBlock = {
          groupIndex,
          eventIndex,
          eventStyle: blockStyle,
          eventHeight: heightInPixels,
          event: currentEvent,
        };

        eventBlocks.push(newBlock);
      });
    });
    const newDay: IDayView = {
      day: currentDate.getDate(),
      dayDate: currentDate,
      isToday: isToday(currentDate),
      eventBlocks: eventBlocks,
    };

    dayViews.push(newDay);
  });
  console.timeEnd("processWeekEvents");
  return { dayViews: dayViews, totalEvents: filteredEvents.length, hours: hours };
}

async function processWeekEvents_2(weekData: IWeekProcessData): Promise<IWeekResponseData> {
  console.time("processWeekEvents_2");
  const weekStart: Date = startOfWeek(weekData.selectedDate);
  const weekEnd: Date = endOfWeek(weekData.selectedDate);
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const [multiDayEvents, recurringEvents] = await Promise.all([
    Promise.resolve(generateMultiDayEventsInPeriod(weekData.events, weekStart, weekEnd, { from: 0, to: 24 })),
    Promise.resolve(generateRecurringEventsInPeriod(weekData.events, weekStart, weekEnd)),
  ]);

  const combinedEvents: IEvent[] = [...multiDayEvents, ...recurringEvents];

  const events = z.array(SEvent).parse(combinedEvents);

  const filteredEvents: IEvent[] = filterEventsByRoom(events, weekData.selectedRoomId).sort(
    (a, b) => a.startDate.getTime() - b.startDate.getTime()
  );

  const { hours, earliestEventHour, latestEventHour } = getVisibleHours(weekData.visibleHours, filteredEvents);

  const eventsByDate = filteredEvents.reduce((acc, event) => {
    const key = format(event.startDate, "yyyy-MM-dd");
    if (!acc.has(key)) acc.set(key, []);
    acc.get(key)!.push(event);
    return acc;
  }, new Map<string, IEvent[]>());

  const dayViews: IDayView[] = weekDays.map((currentDate) => {
    const key = format(currentDate, "yyyy-MM-dd");
    const dailyEvents = eventsByDate.get(key) || [];

    const groupedEvents = groupEvents(dailyEvents);

    const eventBlocks: IEventBlock[] = groupedEvents.flatMap((group, groupIndex) =>
      group.map((event, eventIndex) => {
        const hasOverlap = groupedEvents.some(
          (otherGroup, otherIndex) =>
            otherIndex !== groupIndex &&
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

        const blockStyle = calculateEventBlockStyle(event, currentDate, groupIndex, groupedEvents.length, hasOverlap, {
          from: earliestEventHour,
          to: latestEventHour,
        });

        const durationInMinutes = differenceInMinutes(event.endDate, event.startDate);
        const heightInPixels = (durationInMinutes / 60) * weekData.pixelHeight - 8;

        return {
          groupIndex: groupIndex,
          eventIndex: eventIndex,
          eventStyle: blockStyle,
          eventHeight: heightInPixels,
          event: event,
        };
      })
    );

    return {
      day: currentDate.getDate(),
      dayDate: currentDate,
      isToday: isToday(currentDate),
      eventBlocks: eventBlocks,
    };
  });

  console.timeEnd("processWeekEvents_2");
  return { dayViews: dayViews, totalEvents: filteredEvents.length, hours: hours };
}
