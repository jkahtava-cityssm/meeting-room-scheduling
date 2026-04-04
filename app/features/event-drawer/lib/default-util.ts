import { addMinutes } from "date-fns";
import { CombinedSchema, DurationType } from "../drawer-schema.validator";
import { getValidMinuteAndRolledHour } from "./form-helper";
import { getDurationText } from "@/lib/helpers";
import { IEvent, IEventSingleRoom } from "@/lib/schemas";
import { FlatRRuleSchema, parseRRule } from "./rrule-utils";

export const getFormDefaults = (creationDate: Date, userId?: string, validMinute: number = 15, roomId?: number, maxHour?: number): CombinedSchema => {
	const startDateTime = getValidMinuteAndRolledHour(creationDate, validMinute);
	const endDateTime = addMinutes(startDateTime, 30);
	const isoStart = startDateTime.toISOString();

	return {
		// Step 1 Fields
		eventId: "0",
		userId: userId ?? "",
		eventRecipientIds: [],
		roomId: String(roomId),
		eventRoomIds: roomId ? [String(roomId)] : [],
		title: "",
		description: "",
		statusId: "1",
		startDate: isoStart,
		endDate: endDateTime.toISOString(),
		duration: getDurationText(isoStart, endDateTime.toISOString()),
		isRecurring: "false",
		eventItemIds: [],
		recurrenceId: "",

		// Step 2 Fields
		rule: "",
		ruleDescription: "",
		ruleStartDate: isoStart,
		ruleEndDate: isoStart,
		untilDate: isoStart,

		// Initializing with a valid union discriminant to satisfy TypeScript
		repeatingType: "daily",
		dailyPattern: "daily", // Default to daily for the form
		dayValue: "",

		durationType: "" as DurationType,
		occurrences: "",

		// Optional fields for other union members
		monthlyPattern: "dayInMonth",
		monthValue: "",
		monthDayValue: "",
		monthPeriodValue: "",
		monthWeekdayValue: "",

		yearlyPattern: "dayInMonthInYear",
		yearValue: "",
		yearDayValue: "",
		yearMonthValue: "",
		yearPeriodValue: "",
		yearWeekdayValue: "",

		weekValue: "",
		weekdays: ["monday"],
	} as CombinedSchema;
};

export const mapEventToSchema = (event: IEventSingleRoom | IEvent): CombinedSchema => {
	const isSingleRoom = "roomId" in event && "room" in event;

	const SEventFormDefaults = {
		eventId: String(event.eventId),
		userId: event.userId ? String(event.userId) : "",
		roomId: isSingleRoom ? String((event as IEventSingleRoom).roomId) : "",
		eventRecipientIds: event.eventRecipients ? event.eventRecipients.map(user => String(user.userId)) : [],
		eventRoomIds: event.eventRooms.map(er => String(er.roomId)),
		title: event.title,
		description: event.description ?? "",
		statusId: event.statusId ? String(event.statusId) : "1",
		startDate: event.startDate,
		endDate: event.endDate,
		duration: getDurationText(event.startDate, event.endDate),
		isRecurring: event.recurrenceId ? "true" : "false",
		recurrenceId: event.recurrenceId ? String(event.recurrenceId) : "",
		eventItemIds: event.eventItems ? event.eventItems.map(item => String(item.itemId)) : [],
	};

	// Default recurrence structure
	let SRecurrenceDefaults: FlatRRuleSchema = {
		rule: event.recurrence?.rule ?? "",
		ruleDescription: event.recurrence?.description ?? "",
		ruleStartDate: event.recurrence?.startDate ?? event.startDate,
		ruleEndDate: event.recurrence?.endDate ?? event.endDate,
		untilDate: event.recurrence?.endDate ?? event.endDate,
		repeatingType: "daily" as const, // Start with a base, parseRRule will overwrite
		dailyPattern: "",
		monthlyPattern: "dayInMonth" as const,
		yearlyPattern: "dayInMonthInYear" as const,
		dayValue: "",
		monthValue: "",
		monthDayValue: "",
		monthPeriodValue: "",
		monthWeekdayValue: "",
		yearValue: "",
		yearDayValue: "",
		yearMonthValue: "",
		yearPeriodValue: "",
		yearWeekdayValue: "",
		weekValue: "",
		weekdays: [],
		durationType: "" as DurationType,
		occurrences: "",
	};

	if (event.recurrence) {
		// This function should mutate SRecurrenceDefaults
		// or return a merged object with the correct repeatingType
		SRecurrenceDefaults = parseRRule(event.recurrence.rule, SRecurrenceDefaults);
	}

	return { ...SEventFormDefaults, ...SRecurrenceDefaults } as CombinedSchema;
};
