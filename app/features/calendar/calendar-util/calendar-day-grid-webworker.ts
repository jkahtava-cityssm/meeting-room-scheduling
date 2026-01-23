import { IEvent, SEvent } from "@/lib/schemas/calendar";

import { calculateEventBlockStyle, filterEventsByRoom, getVisibleHours, groupEvents } from "@/lib/helpers";

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
import { TVisibleHours } from "@/lib/types";

export interface IDayGridMessage {
  events: IEvent[];
  currentDate: Date;
  startDate: Date;
  endDate: Date;
  selectedRooms: string[];
  visibleHours: TVisibleHours;
}

export interface IDayGridResponse {
  totalEvents: number;
  dayView: IDayGrid;
  hours: number[];
}

export type IBlockList = Map<string, IBlock[]>;

export interface IDayGrid {
  day: number;
  dayDate: Date;
  isToday: boolean;
  roomBlocks: IBlockList;
}

export interface IBlock {
  key: string;
  groupIndex: number;
  eventIndex: number;
  eventStyle: { top: string; width: string; left: string };
  eventHeight: number;
  event: IEvent;
}

self.onmessage = async (event: MessageEvent<IDayGridMessage & { requestId: number }>) => {
  if (event.data) {
    const result = await processDayEvents(event.data);
    self.postMessage({ ...result, requestId: event.data.requestId });
  }
};

async function processDayEvents(dayData: IDayGridMessage): Promise<IDayGridResponse> {
  const startDate: Date = new Date(dayData.startDate);
  const endDate: Date = new Date(dayData.endDate);

  const currentDate: Date = new Date(dayData.currentDate);

  const selectedRooms: string[] = dayData.selectedRooms;
  const visibleHours: TVisibleHours = dayData.visibleHours;
  const fromTime = visibleHours.from;
  const toTime = visibleHours.to;

  const [multiDayEvents, recurringEvents] = await Promise.all([
    Promise.resolve(generateMultiDayEventsInPeriod(dayData.events as IEvent[], startDate, endDate, fromTime, toTime)),
    Promise.resolve(generateRecurringEventsInPeriod(dayData.events as IEvent[], startDate, endDate)),
  ]);

  const combinedEvents: IEvent[] = [...multiDayEvents, ...recurringEvents];
  const dailyEvents = combinedEvents.filter((event) => isSameDay(event.startDate, startDate));
  //const events = z.array(SEvent).parse(combinedEvents);

  const filteredEvents: IEvent[] = filterEventsByRoom(dailyEvents, selectedRooms).sort(
    (a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime(),
  );

  const eventsByRoom = new Map<string, IEvent[]>();

  const expandedSelectedRooms = selectedRooms.includes("-1")
    ? Array.from(new Set(filteredEvents.map((e) => String(e.roomId))))
    : selectedRooms;

  expandedSelectedRooms.forEach((roomId) => {
    const events = filteredEvents.filter((e) => String(e.roomId) === roomId);

    if (!eventsByRoom.has(roomId)) {
      eventsByRoom.set(roomId, []);
    }
    eventsByRoom.get(roomId)!.push(...events);
  });

  const { hours, earliestEventHour, latestEventHour } = getVisibleHours(visibleHours, filteredEvents);

  const eventBlocksByRoom = new Map<string, IBlock[]>();

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
                },
              ),
            ),
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
          },
        );

        const durationInMinutes = differenceInMinutes(currentEvent.endDate, currentEvent.startDate);
        const heightInPixels = (durationInMinutes / 60) * 96 - 8;

        const newBlock: IBlock = {
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

  const newDay: IDayGrid = {
    day: currentDate.getDate(),
    dayDate: currentDate,
    isToday: isToday(currentDate),
    roomBlocks: eventBlocksByRoom,
  };

  return { dayView: newDay, totalEvents: filteredEvents.length, hours: hours };
}
