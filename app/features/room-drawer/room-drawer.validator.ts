import { IEvent } from "@/lib/schemas/calendar";
import { addMinutes, differenceInYears, endOfDay, startOfDay } from "date-fns";
import { z } from "zod/v4";

import { RRule, rrulestr } from "rrule";
import { getValidMinuteAndRolledHour } from "./multi-step-form-helper";
import { getDurationText } from "@/lib/helpers";
import { ro } from "date-fns/locale";

export const ZRoomForm = z.object({
  roomId: z.string().optional(),
  name: z.string().min(1, "Name is required"),
  color: z.string(),
  icon: z.string(),
  publicFacing: z.boolean().default(false),
  categoryId: z.string(),
  properties: z.array(z.string()),
  roomRoles: z.array(z.string()),
});

export const CombinedRoomSchema = ZRoomForm; //step1Schema.safeExtend(step2Schema.shape);

export type CombinedSchema = z.infer<typeof CombinedRoomSchema>;

export const defaultValues = (creationDate?: Date, userId?: string, validMinute: number = 15): CombinedSchema => {
  const startDateTime = getValidMinuteAndRolledHour(creationDate ? creationDate : new Date(), validMinute);

  const endDateTime = addMinutes(startDateTime, 30);

  const SEventFormDefaults = {
    eventId: "0",
    roomId: "",
    userId: userId ? userId : "",
    title: "",
    description: "",
    statusId: "1",
    startDate: startDateTime.toISOString(),
    endDate: endDateTime.toISOString(),
    duration: getDurationText(startDateTime.toISOString(), endDateTime.toISOString()),
    isRecurring: "false",
    recurrenceId: "",
  };

  const SRecurrenceDefaults = {
    rule: "",
    ruleStartDate: startDateTime.toISOString(),
    ruleEndDate: startDateTime.toISOString(),

    untilDate: startDateTime.toISOString(),
    repeatingType: "",
    dailyPattern: "",
    monthlyPattern: "",
    yearlyPattern: "",

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
    weekdays: ["monday"],

    durationType: "",
    occurrences: "",
  };

  return { ...SEventFormDefaults, ...SRecurrenceDefaults };
};

export const getEventValues = (event: IEvent): CombinedSchema => {
  const SEventFormDefaults: z.infer<typeof step1Schema> = {
    eventId: String(event.eventId),
    roomId: String(event.roomId),
    userId: event.userId ? String(event.userId) : "",
    title: event.title,
    description: event.description ? event.description : "",
    statusId: event.statusId ? String(event.statusId) : "1",
    startDate: event.startDate,
    endDate: event.endDate,
    duration: getDurationText(event.startDate, event.endDate),
    isRecurring: event.recurrenceId ? "true" : "false",
    recurrenceId: event.recurrenceId ? String(event.recurrenceId) : "",
  };

  const SRecurrenceDefaults: z.infer<typeof step2Schema> = {
    rule: event.recurrence ? event.recurrence.rule : "",
    ruleStartDate: event.recurrence ? event.recurrence.startDate : event.startDate,
    ruleEndDate: event.recurrence ? event.recurrence.endDate : event.endDate,
    untilDate: event.recurrence ? event.recurrence.endDate : event.endDate,
    repeatingType: "",
    dailyPattern: "",
    monthlyPattern: "",
    yearlyPattern: "",

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

    durationType: "",
    occurrences: "",
  };

  return { ...SEventFormDefaults, ...SRecurrenceDefaults };
};
