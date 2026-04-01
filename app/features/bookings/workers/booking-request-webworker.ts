import { IEvent, IEventSingleRoom, IRoom, SEvent } from "@/lib/schemas";

import { z } from "zod/v4";

import { generateMultiDayEventsInPeriod, generateRecurringEventsInPeriod } from "@/lib/event-helpers";
import { endOfDay, format, isSameDay, parse, startOfDay } from "date-fns";
import { filterEventsByRoom, getDurationText } from "@/lib/helpers";
import { RRule } from "rrule";
import { IEventCard, IEventCardFields, IRoomSection, ISection } from "../components/types";
import { TColors } from "@/lib/types";
import { IUserRequestProcessData, IUserRequestResponseData } from "../components/user-request";

self.onmessage = async (message: MessageEvent<IUserRequestProcessData>) => {
  if (message.data) {
    const result = await processBookingRequestEvents(message.data.events, message.data.roomId);
    self.postMessage(result);
  }
};

interface MinimalRoom {
  roomId: string;
  roomName: string;
  roomColour: TColors;
}

export function processBookingRequestEvents(events: IEvent[], roomId: string): IUserRequestResponseData {
  const filteredEvents: IEvent[] = filterEventsByRoom(z.array(SEvent).parse(events), roomId);
  const multiRoomEvents = splitMultiRoomEvents(filteredEvents);
  //const Rooms = new Map<number,IEvent[]>()

  // Step 1: Group by date and room
  const eventsByStartDate = multiRoomEvents.reduce((outerMap, event) => {
    const dateKey = format(event.startDate, "yyyy-MM-dd");
    const roomList: MinimalRoom[] = event.eventRooms.map((room) => {
      return { roomId: String(room.roomId), roomName: room.name, roomColour: room.color as TColors };
    });

    if (!outerMap.has(dateKey)) {
      outerMap.set(dateKey, []);
    }

    const roomSections = outerMap.get(dateKey)!;

    roomList.forEach((room) => {
      const card: IEventCard = { event: event, eventCardFields: FormatEventCardFields(event, room) };
      // Find existing room section
      let roomSection = roomSections.find((section) => section.roomId === roomId);

      if (roomSection) {
        roomSection.eventCards.push(card);
      } else {
        roomSection = {
          ...room,
          eventCards: [card],
        };
        roomSections.push(roomSection);
      }
    });

    return outerMap;
  }, new Map<string, IRoomSection[]>());

  // Step 2: Flatten and sort
  const sections: ISection[] = Array.from(eventsByStartDate.entries())
    .map(([dateKey, roomSections]) => ({
      sectionId: dateKey,
      formattedDate: format(parse(dateKey, "yyyy-MM-dd", new Date()), "PPP"),
      roomSection: roomSections
        .map((section) => ({
          ...section,
          eventCards: section.eventCards.sort(
            (a, b) => new Date(a.event.createdAt).getTime() - new Date(b.event.createdAt).getTime(),
          ), // Sort cards by start time
        }))
        .sort((a, b) => a.roomName.localeCompare(b.roomName)), // Sort rooms by name
    }))
    .sort((a, b) => new Date(b.sectionId).getTime() - new Date(a.sectionId).getTime()); // Sort dates DESC

  return { sections, totalEvents: filteredEvents.length };
}

export function splitMultiRoomEvents(events: IEvent[]) {
  const splitEvents: IEventSingleRoom[] = [];
  events.forEach((event) => {
    event.eventRooms.map((room) => {
      splitEvents.push({ ...event, room: room, roomId: room.roomId });
    });
    if (event.eventRooms.length > 1) {
      console.log(`Event: ${event.eventId}`);
    }
  });
  return splitEvents;
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

function FormatEventCardFields(event: IEventSingleRoom, room: MinimalRoom): IEventCardFields {
  const eventType = getEventType(event);
  const { firstInstance, lastInstance, formattedText } = getRecurrenceDetails(event);

  return {
    cardTitle:
      eventType === "Recurring" ? "Recurring Event" : eventType === "Multiple" ? "Multi-Day Event" : "Single Day Event",
    color: room.roomColour as TColors,
    eventTitle: event.title,
    roomName: room.roomName,
    dateRange: formatDateRange(event, eventType, firstInstance, lastInstance),
    timeRange: formatTimeRange(event, eventType),
    duration: getDurationText(event.startDate, event.endDate),
    recurrence: formattedText,
    description: event.description,
    createdDate: format(event.createdAt, "PPP @ p"),
  };
}
