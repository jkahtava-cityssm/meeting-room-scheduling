import { IEvent, SEvent } from "@/lib/schemas/calendar";

import { z } from "zod/v4";

import { calculateEventBlockStyle, filterEventsByRoom, getVisibleHours, groupEvents } from "../../lib/helpers";
import { IDayView, IEventBlock, IWeekProcessData, IWeekResponseData } from "./calendar-week-view";
import { addDays, areIntervalsOverlapping, differenceInMinutes, isSameDay, isToday, startOfWeek } from "date-fns";

self.onmessage = (event: MessageEvent<IWeekProcessData>) => {
  if (event.data) {
    const result = processWeekEvents(event.data);
    self.postMessage(result);
  }
};

function processWeekEvents(weekData: IWeekProcessData): IWeekResponseData {
  const events = z.array(SEvent).parse(weekData.events);

  const filteredEvents: IEvent[] = filterEventsByRoom(events, weekData.selectedRoomId);

  filteredEvents.sort((a, b) => a.startDate.getTime() - b.startDate.getTime());

  const weekStart = startOfWeek(weekData.selectedDate);
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

  return { dayViews: dayViews, totalEvents: filteredEvents.length, hours: hours };
}
