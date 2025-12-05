import { IEvent, SEvent } from "@/lib/schemas/calendar";

import { z } from "zod/v4";

import {
  calculateEventBlockStyle,
  filterEventsByRoom,
  getVisibleHours,
  groupEvents,
  groupEventsByRoom,
  hasOverlapWithinRoom,
} from "@/lib/helpers";

import { areIntervalsOverlapping, differenceInMinutes, endOfDay, isSameDay, isToday, startOfDay } from "date-fns";
import { IDayProcessData, IDayResponseData, IDayView, IEventBlock } from "../calendar-day-view";
import { generateMultiDayEventsInPeriod, generateRecurringEventsInPeriod } from "@/lib/event-helpers";

self.onmessage = async (event: MessageEvent<IDayProcessData>) => {
  if (event.data) {
    const result = await processDayEvents(event.data);
    self.postMessage(result);
  }
};

async function processDayEvents(dayData: IDayProcessData): Promise<IDayResponseData> {
  const startDate: Date = startOfDay(dayData.selectedDate);
  const endDate: Date = endOfDay(dayData.selectedDate);
  const fromTime = dayData.visibleHours.from;
  const toTime = dayData.visibleHours.to;

  const [multiDayEvents, recurringEvents] = await Promise.all([
    Promise.resolve(generateMultiDayEventsInPeriod(dayData.events, startDate, endDate, fromTime, toTime)),
    Promise.resolve(generateRecurringEventsInPeriod(dayData.events, startDate, endDate)),
  ]);

  const combinedEvents: IEvent[] = [...multiDayEvents, ...recurringEvents];

  const events = z.array(SEvent).parse(combinedEvents);

  const filteredEvents: IEvent[] = filterEventsByRoom(events, dayData.selectedRoomId).sort(
    (a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
  );

  const currentDate = dayData.selectedDate;

  const { hours, earliestEventHour, latestEventHour } = getVisibleHours(dayData.visibleHours, filteredEvents);

  const dayViews: IDayView[] = [];

  const eventBlocks: IEventBlock[] = [];

  const dailyEvents = filteredEvents.filter((event) => isSameDay(event.startDate, currentDate));

  const groupedByRoom = groupEventsByRoom(dailyEvents);

  const roomIds = Object.keys(groupedByRoom);

  roomIds.forEach((roomId) => {
    const roomGroups = groupedByRoom[roomId];

    roomGroups.forEach((currentGroup, groupIndex) => {
      currentGroup.forEach((currentEvent, eventIndex) => {
        // Overlap only within this room
        const hasOverlap = hasOverlapWithinRoom(currentEvent, roomGroups, groupIndex);

        const blockStyle = calculateEventBlockStyle(
          currentEvent,
          currentDate,
          groupIndex,
          roomGroups.length,
          hasOverlap,
          { from: earliestEventHour, to: latestEventHour }
        );

        const durationInMinutes = differenceInMinutes(currentEvent.endDate, currentEvent.startDate);
        const heightInPixels = (durationInMinutes / 60) * dayData.pixelHeight - 8;

        const newBlock: IEventBlock = {
          groupIndex,
          eventIndex,
          eventStyle: blockStyle,
          eventHeight: heightInPixels,
          event: currentEvent,
          // Optional: include room info so your UI knows where to render
          roomId: Number(roomId),
        };

        eventBlocks.push(newBlock);
      });
    });
  });

  const newDay: IDayView = {
    day: currentDate.getDate(),
    dayDate: currentDate,
    isToday: isToday(currentDate),
    eventBlocks: eventBlocks,
  };

  dayViews.push(newDay);

  return {
    dayViews: dayViews,
    totalEvents: filteredEvents.length,
    hours: hours,
    filteredEvents: dailyEvents,
    roomIds: roomIds,
  };
}
