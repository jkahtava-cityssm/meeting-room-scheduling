import { IEvent, SEvent } from "@/lib/schemas/calendar";
import { addMinutes, addYears, format, set } from "date-fns";
import { z, ZodObject, ZodRawShape } from "zod/v4";
import { getDurationText } from "./step1";
import { RRule, rrulestr } from "rrule";

/*export const step1Schema = z.object({
  email: z.string().email({ message: "Please enter a valid email address" }),
  firstName: z.string().min(3, "First name must be at least 3 characters"),
  lastName: z.string().min(3, "Last name must be at least 3 characters"),
});*/

export const step2Schema = z.object({
  rule: z.string(),
  startDate: z.string(),
  endDate: z.string(),
  repeatingType: z.string(),
  dailyPattern: z.string(),
  monthlyPattern: z.string(),
  yearlyPattern: z.string(),

  dayValue: z.string(),
  monthValue: z.string(),
  monthDayValue: z.string(),
  monthPeriodValue: z.string(),
  monthWeekdayValue: z.string(),
  yearValue: z.string(),
  yearDayValue: z.string(),
  yearMonthValue: z.string(),
  yearPeriodValue: z.string(),
  yearWeekdayValue: z.string(),

  weekValue: z.string(),
  weekdays: z.array(z.string()).refine((value) => value.some((item) => item), {
    message: "You have to select at least one item.",
  }),

  durationType: z.string(),
  occurrences: z.string(),
  duration: z.string().optional(),
});

export const step1Schema = z
  .object({
    eventId: z.string().optional(),
    roomId: z.string().refine(
      (value) => {
        return value !== "" && !isNaN(Number(value)) && Number(value) > 0;
      },
      {
        message: "Please select a Room",
      }
    ),
    memberId: z.string().refine(
      (value) => {
        return value !== "" && !isNaN(Number(value)) && Number(value) > 0;
      },
      {
        message: "Please select a Member",
      }
    ),
    description: z.string().optional(),
    title: z.string().min(1),
    startDate: z.string(),
    endDate: z.string(),
    recurrenceId: z.string().optional(),
    duration: z.string(),
    startTime: z.string(),
    endTime: z.string(),
    isRecurring: z.string(),
  })
  .check((ctx) => {
    const EndDate = new Date(ctx.value.endDate);
    const StartDate = new Date(ctx.value.startDate);

    const EndDateTime = new Date(ctx.value.endTime);
    const StartDateTime = new Date(ctx.value.startTime);

    const EndTime = new Date(
      new Date(ctx.value.startDate).setHours(EndDateTime.getHours(), EndDateTime.getMinutes())
    ).getTime();
    const StartTime = new Date(
      new Date(ctx.value.startDate).setHours(StartDateTime.getHours(), StartDateTime.getMinutes())
    ).getTime();

    if (EndDate < StartDate) {
      ctx.issues.push({
        code: "custom",
        input: ctx.value,
        path: ["startDate"],
        message: "Start Date exceeds End Date",
      });
      ctx.issues.push({
        code: "custom",
        input: ctx.value,
        path: ["endDate"],
        message: "End Date precedes Start Date",
      });
    }

    if (EndTime < StartTime && EndDate.getTime() === StartDate.getTime()) {
      ctx.issues.push({
        code: "custom",
        input: ctx.value,
        path: ["startDate"],
        message: "Start Time exceeds End Time",
      });
      ctx.issues.push({
        code: "custom",
        input: ctx.value,
        path: ["startTime"],
      });
      ctx.issues.push({
        code: "custom",
        input: ctx.value,
        path: ["endDate"],
        message: "End Time precedes Start Time",
      });
      ctx.issues.push({
        code: "custom",
        input: ctx.value,
        path: ["endTime"],
      });
    }
  });

export const defaultValues = (): CombinedSchema => {
  const startDateTime = format(new Date(), "yyyy-MM-dd hh:mm");
  const endDateTime = format(addMinutes(new Date(), 30), "yyyy-MM-dd hh:mm");

  const SEventFormDefaults = {
    eventId: "0",
    roomId: "",
    memberId: "",
    title: "",
    description: "",
    startDate: format(startDateTime, "yyyy-MM-dd"),
    startTime: format(startDateTime, "yyyy-MM-dd hh:mm"),
    endDate: format(endDateTime, "yyyy-MM-dd"),
    endTime: format(endDateTime, "yyyy-MM-dd hh:mm"),
    duration: getDurationText(startDateTime, startDateTime, endDateTime, endDateTime),
    isRecurring: "false",
    recurrenceId: "",
  };

  const SRecurrenceDefaults = {
    rule: "",
    startDate: format(startDateTime, "yyyy-MM-dd"),
    endDate: "",
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
    memberId: event.memberId ? String(event.memberId) : "",
    title: event.title,
    description: event.description ? event.description : "",
    startDate: format(event.startDate, "yyyy-MM-dd"),
    startTime: format(event.startDate, "yyyy-MM-dd HH:mm:ss"),
    endDate: format(event.endDate, "yyyy-MM-dd"),
    endTime: format(event.endDate, "yyyy-MM-dd HH:mm:ss"),
    duration: getDurationText(
      event.startDate.toISOString(),
      event.startDate.toISOString(),
      event.endDate.toISOString(),
      event.endDate.toISOString()
    ),
    isRecurring: event.recurrenceId ? "true" : "false",
    recurrenceId: event.recurrenceId ? String(event.recurrenceId) : "",
  };

  const SRecurrenceDefaults: z.infer<typeof step2Schema> = {
    rule: "",
    startDate: "",
    endDate: "",
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

  if (event.recurrence) {
    parseRRule(rrulestr(event.recurrence.rule), SRecurrenceDefaults);
  }

  return { ...SEventFormDefaults, ...SRecurrenceDefaults };
};

function parseRRule(rrule: RRule, SRecurrenceDefaults: z.infer<typeof step2Schema>) {
  SRecurrenceDefaults.rule = rrule.toString();
  SRecurrenceDefaults.startDate = format(rrule.options.dtstart, "yyyy-MM-dd HH:mm:ss");
  SRecurrenceDefaults.endDate = format(getEndDate(rrule), "yyyy-MM-dd HH:mm:ss");
  SRecurrenceDefaults.weekdays = getWeekdays(rrule);
  SRecurrenceDefaults.durationType = getDurationType(rrule);
  SRecurrenceDefaults.occurrences = String(rrule.options.count);

  if (rrule.options.freq === RRule.YEARLY) {
    SRecurrenceDefaults.repeatingType = "yearly";
    SRecurrenceDefaults.yearlyPattern = rrule.options.bymonthday ? "dayInMonthInYear" : "patternInMonthInYear";
    SRecurrenceDefaults.yearValue = rrule.options.interval ? String(rrule.options.interval) : "";
    SRecurrenceDefaults.yearDayValue = rrule.options.bymonthday ? String(rrule.options.bymonthday) : "";
    SRecurrenceDefaults.yearMonthValue = rrule.options.bymonth ? String(rrule.options.bymonth) : "";
    SRecurrenceDefaults.yearPeriodValue = rrule.options.bysetpos ? String(rrule.options.bysetpos) : "";
    SRecurrenceDefaults.yearWeekdayValue = rrule.options.byweekday ? String(rrule.options.byweekday) : "";
  }

  if (rrule.options.freq === RRule.MONTHLY) {
    SRecurrenceDefaults.repeatingType = "monthly";
    SRecurrenceDefaults.monthlyPattern = rrule.options.bymonthday ? "dayInMonth" : "patternInMonth";
    SRecurrenceDefaults.monthValue = rrule.options.interval ? String(rrule.options.interval) : "";
    SRecurrenceDefaults.monthDayValue = rrule.options.bymonthday ? String(rrule.options.bymonthday) : "";
    SRecurrenceDefaults.monthPeriodValue = rrule.options.bysetpos ? String(rrule.options.bysetpos) : "";
    SRecurrenceDefaults.monthWeekdayValue = rrule.options.byweekday ? String(rrule.options.byweekday) : "";
  }

  if (rrule.options.freq === RRule.WEEKLY) {
    SRecurrenceDefaults.repeatingType = "weekly";
    SRecurrenceDefaults.monthlyPattern = "weekly";
    SRecurrenceDefaults.weekValue = rrule.options.interval ? String(rrule.options.interval) : "";
    //mappedRule.weekdays = weekdays;
  }

  if (rrule.options.freq === RRule.DAILY) {
    SRecurrenceDefaults.repeatingType = "daily";
    SRecurrenceDefaults.dailyPattern = rrule.options.byweekday ? "daily" : "weekdays";
    SRecurrenceDefaults.dayValue =
      rrule.options.interval && rrule.options.byweekday ? String(rrule.options.interval) : "";
    //mappedRule.weekdays = weekdays;
  }

  return SRecurrenceDefaults;
}

function getDayType(value: number) {
  switch (value) {
    case 0:
      return "monday";
    case 1:
      return "tuesday";
    case 2:
      return "wednesday";
    case 3:
      return "thursday";
    case 4:
      return "friday";
    case 5:
      return "saturday";
    case 6:
      return "sunday";
    default:
      return "";
  }
}

function getWeekdays(rrule: RRule) {
  return rrule.options.byweekday
    ? rrule.options.byweekday.map((value) => {
        return getDayType(value);
      })
    : ["monday"];
}

function getEndDate(rrule: RRule) {
  return rrule.options.until ? rrule.options.until : addYears(rrule.options.dtstart, 200);
}

function getDurationType(rrule: RRule) {
  if (rrule.options.count) {
    return "count";
  }

  const endDate: Date = rrule.options.until ? rrule.options.until : new Date("9999-12-31");
  const startDate: Date = rrule.options.dtstart;
  const difference = differenceInYears(endOfDay(endDate), startOfDay(startDate));

  if (difference >= 200) {
    return "forever";
  }

  return "until";
}

export const CombinedEventSchema = step1Schema.extend(step2Schema.shape);

export type CombinedSchema = z.infer<typeof CombinedEventSchema>;
