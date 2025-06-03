import { IEvent, SEvent } from "@/lib/schemas/schemas";

import { z } from "zod";

import { calculateEventBlockStyle, filterEventsByRoom, getVisibleHours, groupEvents } from "../../lib/helpers";

import { areIntervalsOverlapping, differenceInMinutes, isSameDay, isToday } from "date-fns";
import { DayProcessData, DayResponseData, DayView, EventBlock } from "./calendar-day-view";

self.onmessage = (event: MessageEvent<DayProcessData>) => {
  if (event.data) {
    const result = processDayEvents(event.data);
    self.postMessage(result);
  }
};

function processDayEvents(dayData: DayProcessData): DayResponseData {
  console.time("Collection Start");
  const events = z.array(SEvent).parse(dayData.events);

  const filteredEvents: IEvent[] = filterEventsByRoom(events, dayData.selectedRoomId);

  filteredEvents.sort((a, b) => a.startDate.getTime() - b.startDate.getTime());

  const currentDate = dayData.selectedDate;

  const { hours, earliestEventHour, latestEventHour } = getVisibleHours(dayData.visibleHours, filteredEvents);

  const dayViews: DayView[] = [];

  console.timeEnd("Collection Start");

  console.time("Process Start");

  const eventBlocks: EventBlock[] = [];

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
      const heightInPixels = (durationInMinutes / 60) * dayData.pixelHeight - 8;

      const newBlock: EventBlock = {
        groupIndex,
        eventIndex,
        eventStyle: blockStyle,
        eventHeight: heightInPixels,
        event: currentEvent,
      };

      eventBlocks.push(newBlock);
    });
  });
  const newDay: DayView = {
    day: currentDate.getDate(),
    dayDate: currentDate,
    isToday: isToday(currentDate),
    eventBlocks: eventBlocks,
  };

  dayViews.push(newDay);

  return { dayViews: dayViews, totalEvents: filteredEvents.length, hours: hours };
}
