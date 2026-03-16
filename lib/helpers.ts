import {
	addDays,
	addMonths,
	addWeeks,
	subDays,
	subMonths,
	subWeeks,
	isSameDay,
	startOfWeek,
	startOfMonth,
	endOfMonth,
	endOfWeek,
	format,
	differenceInMinutes,
	startOfDay,
	endOfYear,
	startOfYear,
	subYears,
	addYears,
	isWithinInterval,
	set,
	endOfDay,
	areIntervalsOverlapping,
	compareAsc,
	getDaysInMonth,
	intervalToDuration,
	formatDuration,
	isDate,
} from "date-fns";

import type { TCalendarView, TVisibleHours } from "@/lib/types";

import { IEvent } from "./schemas/calendar";

export const VISIBLE_HOURS: TVisibleHours = { from: 0, to: 23 };
export const MAX_VISIBLE_EVENTS = 5;

// ================ Header helper functions ================ //

export function rangeText(view: TCalendarView, date: Date) {
	const formatString = "MMM d, yyyy";
	let start: Date;
	let end: Date;

	switch (view) {
		case "year":
			start = startOfYear(date);
			end = endOfYear(date);
			break;
		case "month":
			start = startOfMonth(date);
			end = endOfMonth(date);
			break;
		case "week":
			start = startOfWeek(date);
			end = endOfWeek(date);
			break;
		case "day":
		case "agenda":
			return format(date, formatString);
		case "all":
			return "All Dates";
		default:
			return "Error while formatting ";
	}

	return `${format(start, formatString)} - ${format(end, formatString)}`;
}

export function navigateDate(date: Date, view: TCalendarView, direction: "previous" | "next"): Date {
	const operations = {
		agenda: direction === "next" ? addDays : subDays,
		year: direction === "next" ? addYears : subYears,
		month: direction === "next" ? addMonths : subMonths,
		week: direction === "next" ? addWeeks : subWeeks,
		day: direction === "next" ? addDays : subDays,
		public: direction === "next" ? addDays : subDays,
		all: (date: Date, _: number) => date,
	};

	return operations[view](date, 1);
}

export function navigateURL(date: Date | null, view: TCalendarView): string {
	const path = {
		agenda: "?view=agenda",
		year: "?view=year",
		month: "?view=month",
		week: "?view=week",
		day: "?view=day",
		public: "?view=public",
		all: "?view=all",
	};

	if (date === null) {
		return path[view];
	}

	return path[view] + "&selectedDate=" + format(date, "yyyy-MM-dd");
}

/**
 * Converts Local Datetime values into RRULE UTC datetime
 *
 * @param date Local Datetime
 * @returns new UTC Date
 *
 * * RRULE uses a UTC datetime to calculate recurrence
 * * RRULE dates need to be converted to UTC Datetimes
 * * see https://github.com/jkbrzt/rrule/issues/336 explains in further detail
 */
export function convertDateToRRuleDate(date: Date) {
	return new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate(), date.getHours(), date.getMinutes(), date.getSeconds()));
}

/**
 * Converts RRule UTC Date into a Local Datetime

 * @param date UTC Datetime
 * @returns new Local Datetime
 * 
 * * RRULE uses a UTC datetime to calculate recurrence
 * * RRULE dates need to be converted back to Local Datetimes
 * * see https://github.com/jkbrzt/rrule/issues/336 explains in further detail 
 */
export function convertRRuleDateToDate(date: Date) {
	return new Date(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), date.getUTCHours(), date.getUTCMinutes(), date.getUTCSeconds());
}

export function roundToPrecision(value: number, precision: number) {
	if (precision < 0) precision = 0;

	const padding = [
		...Array(precision)
			.keys()
			.map(() => {
				return "0";
			}),
	].join("");

	const adjustment = Number("1" + padding);
	return Math.round(value * adjustment) / adjustment;
}

/**
 * Loop through each event, increase the Earliest and Latest Visible Hours if an Event occurs outside of the window
 * @param visibleHours
 * @param singleDayEvents
 * @returns
 */
export function getVisibleHours(visibleHours: TVisibleHours, singleDayEvents: IEvent[]) {
	let earliestEventHour = visibleHours.from;
	let latestEventHour = visibleHours.to;

	singleDayEvents.forEach(event => {
		const startHour = new Date(event.startDate).getHours();
		const endTime = new Date(event.endDate);
		const endHour = endTime.getHours() + (endTime.getMinutes() > 0 ? 1 : 0);
		if (startHour < earliestEventHour) earliestEventHour = startHour;
		if (endHour > latestEventHour) latestEventHour = endHour;
	});

	latestEventHour = Math.min(latestEventHour, 23);

	const hours = Array.from({ length: latestEventHour - earliestEventHour }, (_, i) => i + earliestEventHour);

	return { hours, earliestEventHour, latestEventHour };
}

// ================ Month view helper functions ================ //

export function getDaysInView(selectedDate: Date) {
	const daysInMonth = getDaysInMonth(selectedDate);
	const firstDayOfMonth = startOfMonth(selectedDate);
	const beforeDays = firstDayOfMonth.getDay();

	const daysInLastRow = (daysInMonth + beforeDays) % 7;
	const afterDays = daysInLastRow > 0 ? 7 - daysInLastRow : 0;
	const firstDate = startOfDay(subDays(firstDayOfMonth, beforeDays));
	const lastDate = endOfDay(addDays(firstDayOfMonth, daysInMonth + afterDays - 1));

	return { startDate: firstDate, endDate: lastDate };
}

/*########################################################################
    GENERIC FUNCTIONS
########################################################################*/

export function filterEventsByRoom(events: IEvent[], selectedRoomId: string[] | string) {
	const roomIds = Array.isArray(selectedRoomId) ? selectedRoomId : [selectedRoomId];

	if (roomIds.includes("-1")) {
		return events;
	}

	const results = events.filter(event => {
		return roomIds.includes(event.roomId.toString());
	});

	return results;
}

export const getDurationText = (startDateTime: string, endDateTime: string): string => {
	const duration = formatDuration(intervalToDuration({ start: new Date(startDateTime), end: new Date(endDateTime) }), {
		format: ["years", "months", "days", "hours", "minutes"],
		delimiter: ", ",
	});

	return duration.length === 0 ? "0 Minutes" : duration;
};

export function getDistinctValuesByKey<T, K extends keyof T>(list: T[], key: K): T[K][] {
	if (!list) return [];

	return [...new Set(list.map(item => item[key]))];
}
