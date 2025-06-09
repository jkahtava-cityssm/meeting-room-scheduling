import { IEvent, SEvent } from "@/lib/schemas/schemas";

import { z } from "zod";

import { filterEventsByRoom } from "../../lib/helpers";
import { AgendaProcessData, AgendaResponseData } from "./calendar-agenda-view";

self.onmessage = (event: MessageEvent<AgendaProcessData>) => {
  if (event.data) {
    const result = processAgendaEvents(event.data);
    self.postMessage(result);
  }
};

function processAgendaEvents(dayData: AgendaProcessData): AgendaResponseData {
  const events = z.array(SEvent).parse(dayData.events);

  const filteredEvents: IEvent[] = filterEventsByRoom(events, dayData.selectedRoomId);

  filteredEvents.sort((a, b) => a.startDate.getTime() - b.startDate.getTime());

  return { sortedEvents: filteredEvents, totalEvents: filteredEvents.length };
}
