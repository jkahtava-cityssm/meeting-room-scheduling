import { IEvent, SEvent } from "@/lib/schemas/calendar";

import { z } from "zod/v4";

import { generateMultiDayEventsInPeriod, generateRecurringEventsInPeriod } from "@/lib/event-helpers";
import { endOfDay, format, isSameDay, startOfDay } from "date-fns";
import { filterEventsByRoom, getDurationText } from "@/lib/helpers";
import { RRule } from "rrule";
import { IEventCard, IEventCardFields, IRoomSection, ISection } from "../components/types";
import { TColors } from "@/lib/types";
import { IAgendaProcessData, IAgendaResponseData } from "@/components/calendar/calendar-agenda-view";

self.onmessage = async (event: MessageEvent<{ events: IEvent[] }>) => {
  if (event.data) {
    const result = await processBookingRequestEvents(event.data.events, "-1");
    self.postMessage(result);
  }
};

export function processBookingRequestEvents(
  passedEvents: IEvent[],
  roomId: string
): { totalEvents: number; sections: ISection[] } {
  /*Promise<{
  totalEvents: number;
  eventsByDate: Map<string, IRoomSection[]>;
}> */ const events = z.array(SEvent).parse(passedEvents);

  const filteredEvents: IEvent[] = filterEventsByRoom(events, roomId);

  //const Rooms = new Map<number,IEvent[]>()

  // Step 1: Group by date and room
  const eventsByDate = filteredEvents.reduce((outerMap, event) => {
    const dateKey = format(event.startDate, "yyyy-MM-dd");
    const roomId = String(event.roomId);

    if (!outerMap.has(dateKey)) {
      outerMap.set(dateKey, []);
    }

    const roomSections = outerMap.get(dateKey)!;
    const card: IEventCard = { event: event, eventCardFields: FormatEventCardFields(event) };

    // Find existing room section
    let roomSection = roomSections.find((section) => section.roomId === roomId);

    if (roomSection) {
      roomSection.eventCards.push(card);
    } else {
      roomSection = {
        roomId: roomId,
        roomName: event.room.name,
        roomColour: event.room.color as TColors,
        eventCards: [card],
      };
      roomSections.push(roomSection);
    }

    return outerMap;
  }, new Map<string, IRoomSection[]>());

  // Step 2: Flatten and sort
  const sections: ISection[] = Array.from(eventsByDate.entries())
    .map(([dateKey, roomSections]) => ({
      sectionId: dateKey,
      formattedDate: format(new Date(dateKey), "PPP"),
      roomSection: roomSections
        .map((section) => ({
          ...section,
          eventCards: section.eventCards.sort(
            (a, b) => new Date(a.event.startDate).getTime() - new Date(b.event.startDate).getTime()
          ), // Sort cards by start time
        }))
        .sort((a, b) => a.roomName.localeCompare(b.roomName)), // Sort rooms by name
    }))
    .sort((a, b) => new Date(b.sectionId).getTime() - new Date(a.sectionId).getTime()); // Sort dates DESC

  return { sections, totalEvents: filteredEvents.length };
}

type EventType = "Recurring" | "Multiple" | "Single";

function getEventType(event: IEvent): EventType {
  if (event.recurrenceId) return "Recurring";
  return isSameDay(event.endDate, event.startDate) ? "Single" : "Multiple";
}

function getRecurrenceDetails(event: IEvent) {
  if (!event.recurrence) return { firstInstance: undefined, lastInstance: undefined, formattedText: "" };

  const rule = RRule.fromString(event.recurrence.rule);
  const firstInstance = rule.all((date, length) => {
    return length > 0 ? false : true;
  })[0];
  const lastInstance = event.recurrence.endDate;
  const text = rule.toText();
  const formattedText = text.charAt(0).toUpperCase() + text.slice(1);

  return { firstInstance: firstInstance.toISOString(), lastInstance, formattedText };
}

function formatDateRange(event: IEvent, type: EventType, firstInstance?: string, lastInstance?: string) {
  switch (type) {
    case "Recurring":
      return firstInstance && lastInstance ? `${format(firstInstance, "PPP")} - ${format(lastInstance, "PPP")}` : "";
    case "Multiple":
      return format(event.startDate, "PP @ p");
    case "Single":
      return format(event.startDate, "PPP");
    default:
      return "";
  }
}

function formatTimeRange(event: IEvent, type: EventType) {
  switch (type) {
    case "Recurring":
      return `${format(event.startDate, "p")} - ${format(event.endDate, "p")}`;
    case "Multiple":
      return format(event.endDate, "PP @ p");
    default:
      return `${format(event.startDate, "p")} - ${format(event.endDate, "p")}`;
  }
}

function FormatEventCardFields(event: IEvent): IEventCardFields {
  const eventType = getEventType(event);
  const { firstInstance, lastInstance, formattedText } = getRecurrenceDetails(event);

  return {
    cardTitle:
      eventType === "Recurring" ? "Recurring Event" : eventType === "Multiple" ? "Multi-Day Event" : "Single Day Event",
    color: event.room.color as TColors,
    eventTitle: event.title,
    roomName: event.room.name,
    dateRange: formatDateRange(event, eventType, firstInstance, lastInstance),
    timeRange: formatTimeRange(event, eventType),
    duration: getDurationText(event.startDate, event.endDate),
    recurrence: formattedText,
    description: event.description,
  };
}
