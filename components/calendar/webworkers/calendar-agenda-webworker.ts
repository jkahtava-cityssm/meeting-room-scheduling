import { IEvent, SEvent } from "@/lib/schemas/calendar";

import { z } from "zod/v4";

import { filterEventsByRoom } from "../../../lib/helpers";
import { IAgendaProcessData, IAgendaResponseData } from "../calendar-agenda-view";
import { generateMultiDayEventsInPeriod, generateRecurringEventsInPeriod } from "@/lib/event-helpers";
import { endOfDay, startOfDay } from "date-fns";

self.onmessage = async (event: MessageEvent<IAgendaProcessData>) => {
  if (event.data) {
    const result = await processAgendaEvents(event.data);
    self.postMessage(result);
  }
};

async function processAgendaEvents(dayData: IAgendaProcessData): Promise<IAgendaResponseData> {
  const startDate: Date = startOfDay(dayData.selectedDate);
  const endDate: Date = endOfDay(dayData.selectedDate);
  const fromTime = dayData.visibleHours.from
  const toTime = dayData.visibleHours.to

  const [multiDayEvents, recurringEvents] = await Promise.all([
    Promise.resolve(generateMultiDayEventsInPeriod(dayData.events, startDate, endDate,fromTime,toTime )),
    Promise.resolve(generateRecurringEventsInPeriod(dayData.events, startDate, endDate)),
  ]);

  const combinedEvents: IEvent[] = [...multiDayEvents, ...recurringEvents];
  const events = z.array(SEvent).parse(combinedEvents);

  const filteredEvents: IEvent[] = filterEventsByRoom(events, dayData.selectedRoomId).sort(
    (a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
  );

  return { sortedEvents: filteredEvents, totalEvents: filteredEvents.length };
}
