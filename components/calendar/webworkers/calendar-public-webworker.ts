import { IEvent, SEvent } from "@/lib/schemas/calendar";

import { z } from "zod/v4";

import { calculateEventBlockStyle, filterEventsByRoom, getVisibleHours, groupEvents } from "../../../lib/helpers";

import {
  areIntervalsOverlapping,
  differenceInMinutes,
  endOfDay,
  format,
  isSameDay,
  isToday,
  startOfDay,
} from "date-fns";

import { generateMultiDayEventsInPeriod, generateRecurringEventsInPeriod } from "@/lib/event-helpers";
import { IDayView, IEventBlock, IPublicProcessData, IPublicResponseData } from "../calendar-public-view";

self.onmessage = async (event: MessageEvent<IPublicProcessData>) => {
  if (event.data) {
    const result = await processDayEvents(event.data);
    self.postMessage(result);
  }
};

async function processDayEvents(dayData: IPublicProcessData): Promise<IPublicResponseData> {
  
  const startDate: Date = startOfDay(dayData.selectedDate);
  const endDate: Date = endOfDay(dayData.selectedDate);

      const fromTime = dayData.visibleHours.from
  const toTime = dayData.visibleHours.to

  const [multiDayEvents, recurringEvents] = await Promise.all([
    Promise.resolve(
      generateMultiDayEventsInPeriod(dayData.events as IEvent[], startDate, endDate, fromTime,toTime)
    ),
    Promise.resolve(generateRecurringEventsInPeriod(dayData.events as IEvent[], startDate, endDate)),
  ]);
  const currentDate = dayData.selectedDate;

  const combinedEvents: IEvent[] = [...multiDayEvents, ...recurringEvents];
  const dailyEvents = combinedEvents.filter((event) => isSameDay(event.startDate, currentDate));
  //const events = z.array(SEvent).parse(combinedEvents);

  const eventsByRoom = new Map<string, IEvent[]>();

  dayData.roomIdList.forEach((roomId) => {
    const events = filterEventsByRoom(dailyEvents, roomId).sort(
      (a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
    );

    if (!eventsByRoom.has(roomId)) {
      eventsByRoom.set(roomId, []);
    }
    eventsByRoom.get(roomId)!.push(...events);
  });

  const filteredEvents: IEvent[] = filterEventsByRoom(dailyEvents, dayData.roomIdList).sort(
    (a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
  );

  const { hours, earliestEventHour, latestEventHour } = getVisibleHours(dayData.visibleHours, filteredEvents);

  const dayViews: IDayView[] = [];

  const eventBlocks: IEventBlock[] = [];

  const eventBlocksByRoom = new Map<string, IEventBlock[]>();

  //const dailyEvents = filteredEvents.filter((event) => isSameDay(event.startDate, currentDate));

  for (const [roomId, events] of eventsByRoom.entries()) {
    const groupedEvents = groupEvents(events);

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

        const newBlock: IEventBlock = {
          key: `block-${format(currentEvent.startDate, "yyyy-MM-dd-HH-mm")}-event-${currentEvent.eventId}`,
          groupIndex,
          eventIndex,
          eventStyle: blockStyle,
          eventHeight: heightInPixels,
          event: currentEvent,
        };

        if (!eventBlocksByRoom.has(roomId)) {
          eventBlocksByRoom.set(roomId, []);
        }
        eventBlocksByRoom.get(roomId)!.push(newBlock);
      });
    });
  }

  const newDay: IDayView = {
    day: currentDate.getDate(),
    dayDate: currentDate,
    isToday: isToday(currentDate),
    eventBlocks: eventBlocksByRoom,
  };

  return { dayView: newDay, totalEvents: filteredEvents.length, hours: hours };
}
