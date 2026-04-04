import { IEvent, IEventSingleRoom, IRoom, SEvent, SEventSingleRoom } from "@/lib/schemas";

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

export function processBookingRequestEvents(events: IEvent[], selectedRoomId: string): IUserRequestResponseData {
	const filteredEvents: IEvent[] = filterEventsByRoom(z.array(SEvent).parse(events), selectedRoomId);
	const multiRoomEvents = extractSingleRoomEvents(filteredEvents);
	//const Rooms = new Map<number,IEvent[]>()

	// Step 1: Group by date and room
	const eventsByStartDate = multiRoomEvents.reduce((outerMap, event) => {
		const dateKey = format(event.startDate, "yyyy-MM-dd");
		const roomId = String(event.roomId);

		if (!outerMap.has(dateKey)) {
			outerMap.set(dateKey, []);
		}

		const roomSections = outerMap.get(dateKey)!;

		const card: IEventCard = { event: event, eventCardFields: FormatEventCardFields(event) };
		// Find existing room section
		let roomSection = roomSections.find(section => section.roomId === roomId);

		if (roomSection) {
			roomSection.eventCards.push(card);
		} else {
			roomSection = {
				roomId: roomId,
				roomName: event.roomName,
				roomColour: event.roomColor as TColors,
				eventCards: [card],
			};
			roomSections.push(roomSection);
		}

		return outerMap;
	}, new Map<string, IRoomSection[]>());

	// Step 2: Flatten and sort
	const sections: ISection[] = Array.from(eventsByStartDate.entries())
		.map(([dateKey, roomSections]) => ({
			sectionId: dateKey,
			formattedDate: format(parse(dateKey, "yyyy-MM-dd", new Date()), "PPP"),
			roomSection: roomSections
				.map(section => ({
					...section,
					eventCards: section.eventCards.sort((a, b) => new Date(a.event.createdAt).getTime() - new Date(b.event.createdAt).getTime()), // Sort cards by start time
				}))
				.sort((a, b) => a.roomName.localeCompare(b.roomName)), // Sort rooms by name
		}))
		.sort((a, b) => new Date(b.sectionId).getTime() - new Date(a.sectionId).getTime()); // Sort dates DESC

	return { sections, totalEvents: filteredEvents.length };
}

const MultiRooms: IRoom = {
	roomId: 0,
	name: "Multiple Rooms",
	color: "zinc",
	createdAt: new Date().toISOString(),
	updatedAt: new Date().toISOString(),
	icon: "asterisk",
	publicFacing: false,
	displayOrder: null,
	roomCategoryId: -1,
	roomCategory: {
		roomCategoryId: -1,
		name: "All",
		createdAt: new Date().toISOString(),
		updatedAt: new Date().toISOString(),
	},
};

export function extractSingleRoomEvents(events: IEvent[]) {
	const splitEvents: IEventSingleRoom[] = [];
	events.forEach(event => {
		if (event.eventRooms.length === 1) {
			event.eventRooms.map(room => {
				splitEvents.push({ ...event, roomId: room.roomId, roomName: room.name, roomColor: room.color, roomIcon: room.icon });
			});
		} else {
			splitEvents.push({
				...event,
				roomId: event.eventRooms[0].roomId,
				roomName: event.eventRooms[0].name,
				roomColor: event.eventRooms[0].color,
				roomIcon: event.eventRooms[0].icon,
			});
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

function FormatEventCardFields(event: IEventSingleRoom): IEventCardFields {
	const eventType = getEventType(event);
	const { firstInstance, lastInstance, formattedText } = getRecurrenceDetails(event);

	return {
		cardTitle: eventType === "Recurring" ? "Recurring Event" : eventType === "Multiple" ? "Multi-Day Event" : "Single Day Event",
		color: event.roomColor as TColors,
		eventTitle: event.title,
		badgeName: event.roomId === 0 ? "Multiple Rooms" : event.roomName,
		roomName: event.roomId === 0 ? event.eventRooms.map(room => room.name).join(", ") : event.roomName,
		isMultiRoom: event.roomId === 0,
		dateRange: formatDateRange(event, eventType, firstInstance, lastInstance),
		timeRange: formatTimeRange(event, eventType),
		duration: getDurationText(event.startDate, event.endDate),
		recurrence: formattedText,
		description: event.description,
		createdDate: format(event.createdAt, "PPP @ p"),
	};
}
