import { IEvent, SEvent } from "@/lib/schemas/calendar";

import { z } from "zod/v4";

import { filterEventsByRoom } from "../../../lib/helpers";
import { IAgendaProcessData, IAgendaResponseData } from "../calendar-agenda-view";
import { generateMultiDayEventsInPeriod, generateRecurringEventsInPeriod } from "@/lib/event-helpers";
import { endOfDay, startOfDay } from "date-fns";

self.onmessage = (event: MessageEvent<IAgendaProcessData>) => {
  if (event.data) {
    const result = processAgendaEvents(event.data);
    self.postMessage(result);
  }
};

function processAgendaEvents(dayData: IAgendaProcessData): IAgendaResponseData {
  const startDate: Date = startOfDay(dayData.selectedDate);
  const endDate: Date = endOfDay(dayData.selectedDate);

  const combinedEvents: IEvent[] = [
    ...generateMultiDayEventsInPeriod(dayData.events, startDate, endDate, { from: 0, to: 24 }),
    ...generateRecurringEventsInPeriod(dayData.events, startDate, endDate),
  ];

  const events = z.array(SEvent).parse(combinedEvents);

  const filteredEvents: IEvent[] = filterEventsByRoom(events, dayData.selectedRoomId);

  filteredEvents.sort((a, b) => a.startDate.getTime() - b.startDate.getTime());

  return { sortedEvents: filteredEvents, totalEvents: filteredEvents.length };
}
