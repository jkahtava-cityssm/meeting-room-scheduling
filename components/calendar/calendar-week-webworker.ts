import { IEvent, SEvent } from "@/lib/schemas/schemas";

import { z } from "zod";

import { calculateEventBlockStyle, filterEventsByRoom, getVisibleHours, groupEvents } from "../../lib/helpers";
import { DayView, EventBlock, WeekProcessData, WeekResponseData } from "./calendar-week-view";
import { addDays, areIntervalsOverlapping, differenceInMinutes, isSameDay, isToday, startOfWeek } from "date-fns";

self.onmessage = (event: MessageEvent<WeekProcessData>) => {
  if (event.data) {
    const result = processWeekEvents(event.data);
    self.postMessage(result);
  }
};

function processWeekEvents(weekData: WeekProcessData): WeekResponseData {
  console.time("Collection Start");
  const events = z.array(SEvent).parse(weekData.events);

  const filteredEvents: IEvent[] = filterEventsByRoom(events, weekData.selectedRoomId);

  filteredEvents.sort((a, b) => a.startDate.getTime() - b.startDate.getTime());

  const weekStart = startOfWeek(weekData.selectedDate);
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const { hours, earliestEventHour, latestEventHour } = getVisibleHours(weekData.visibleHours, filteredEvents);

  const dayViews: DayView[] = [];

  console.timeEnd("Collection Start");

  console.time("Process Start");
  weekDays.forEach((currentDate) => {
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
        const heightInPixels = (durationInMinutes / 60) * weekData.pixelHeight - 8;

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
  });

  console.timeEnd("Process Start");
  return { events: filteredEvents, dayViews: dayViews, totalEvents: filteredEvents.length, hours: hours };
}
