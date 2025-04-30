import { useCalendar } from "@/calendar/contexts/calendar-context";

import type { IEvent } from "@/calendar/interfaces";
import { generateMultiDayBlocks } from "../helpers";
import { VISIBLE_HOURS } from "../mocks";

export function useUpdateEvent() {
  const { setLocalEvents } = useCalendar();

  // This is just and example, in a real scenario
  // you would call an API to update the event
  const updateEvent = (event: IEvent) => {
    const newEvent: IEvent = event;

    newEvent.startDate = new Date(event.startDate).toISOString();
    newEvent.endDate = new Date(event.endDate).toISOString();

    const eventList = generateMultiDayBlocks(newEvent, VISIBLE_HOURS);

    //THIS IS A USE_EFFECT STATEMENT THAT IS COLLECTING THE LAST EVENT ARRAY
    //IT IS THEN REMOVING ELEMENTS AT THE SPECIFIED INDEX AND INSERTING A NEW ONE

    setLocalEvents((prev) => {
      const firstIndex = prev.findIndex((e) => e.id === event.id);
      const lastIndex = prev.findLastIndex((e) => e.id === event.id);
      if (firstIndex === -1) return prev;

      const firstArrayHalf = [...prev.slice(0, firstIndex)];
      const lastArrayHalf = [...prev.slice(lastIndex + 1)];

      if (eventList.length > 0) {
        return [...firstArrayHalf, ...eventList, ...lastArrayHalf];
      }
      return [...firstArrayHalf, newEvent, ...lastArrayHalf];
    });
  };

  return { updateEvent };
}
