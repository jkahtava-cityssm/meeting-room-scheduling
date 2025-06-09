import { IEvent, SEvent } from "@/lib/schemas/schemas";

import { z } from "zod";

import { filterEventsByRoom } from "../../lib/helpers";
import { IAgendaProcessData, IAgendaResponseData } from "./calendar-agenda-view";

self.onmessage = (event: MessageEvent<IAgendaProcessData>) => {
  if (event.data) {
    const result = processAgendaEvents(event.data);
    self.postMessage(result);
  }
};

function processAgendaEvents(dayData: IAgendaProcessData): IAgendaResponseData {
  const events = z.array(SEvent).parse(dayData.events);

  const filteredEvents: IEvent[] = filterEventsByRoom(events, dayData.selectedRoomId);

  filteredEvents.sort((a, b) => a.startDate.getTime() - b.startDate.getTime());

  return { sortedEvents: filteredEvents, totalEvents: filteredEvents.length };
}
