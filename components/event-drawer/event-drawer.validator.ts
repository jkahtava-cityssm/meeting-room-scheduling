import { IEvent } from "@/lib/schemas/calendar";
import { addMinutes, addYears, differenceInYears, endOfDay, format, set, startOfDay } from "date-fns";
import { z } from "zod/v4";
import { getDurationText } from "./step1";
import { RRule, rrulestr } from "rrule";
import { getValidMinuteAndRolledHour } from "./multi-step-form-helper";

/*export const step1Schema = z.object({
  email: z.string().email({ message: "Please enter a valid email address" }),
  firstName: z.string().min(3, "First name must be at least 3 characters"),
  lastName: z.string().min(3, "Last name must be at least 3 characters"),
});*/

export const step2Schema = z
  .object({
    rule: z.string().min(1, "Please define a recurrence rule"),
    ruleStartDate: z.string(),
    ruleEndDate: z.string(),
    untilDate: z.string(),
    repeatingType: z.string().min(1, "Please select a repeating type"),
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

    durationType: z.string().min(1, "Please select a duration type"),
    occurrences: z.string(),
    duration: z.string().optional(),
  })
  .check((ctx) => {
    if (ctx.value.durationType === "until" && ctx.value.ruleEndDate === "") {
      ctx.issues.push({
        code: "custom",
        input: ctx.value,
        path: ["ruleEndDate"],
        message: "Please Specify an End Date",
      });
    } else if (ctx.value.durationType === "forever" && ctx.value.ruleEndDate === "") {
      ctx.issues.push({
        code: "custom",
        input: ctx.value,
        path: ["ruleEndDate"],
        message: "Please Specify an End Date",
      });
    } else if (ctx.value.durationType === "count" && (ctx.value.occurrences === "" || ctx.value.occurrences === "0")) {
      ctx.issues.push({
        code: "custom",
        input: ctx.value,
        path: ["occurrences"],
        message: "Please enter the number of occurrences",
      });
    }

    if (ctx.value.repeatingType === "daily") {
      if (ctx.value.dailyPattern === "") {
        ctx.issues.push({
          code: "custom",
          input: ctx.value,
          path: ["dailyPattern"],
          message: "You must choose an option",
        });
      }
      if (ctx.value.dailyPattern === "daily") {
        if (ctx.value.dayValue === "" || ctx.value.dayValue === "0") {
          ctx.issues.push({
            code: "custom",
            input: ctx.value,
            path: ["dayValue"],
            message: "Indicate how often the event repeats",
          });
        }
      }
    } else if (ctx.value.repeatingType === "weekly") {
      if (ctx.value.weekValue === "" || ctx.value.weekValue === "0") {
        ctx.issues.push({
          code: "custom",
          input: ctx.value,
          path: ["weekValue"],
          message: "Indicate how often the event repeats",
        });
      }
      if (ctx.value.weekdays.length === 0) {
        ctx.issues.push({
          code: "custom",
          input: ctx.value,
          path: ["weekdays"],
          message: "Please select atleast one weekday",
        });
      }
      //weekValue
      //weekdays
    } else if (ctx.value.repeatingType === "monthly") {
      verifyMonthlyPattern(ctx);
    } else if (ctx.value.repeatingType === "yearly") {
      verifyYearlyPattern(ctx);
    }
  });

const verifyMonthlyPattern = (ctx: any) => {
  if (ctx.value.monthlyPattern === "") {
    ctx.issues.push({
      code: "custom",
      input: ctx.value,
      path: ["monthlyPattern"],
      message: "Pick a repeating pattern from the available options",
    });
  }

  if (ctx.value.monthValue === "" || ctx.value.monthValue === "0") {
    ctx.issues.push({
      code: "custom",
      input: ctx.value,
      path: ["monthValue"],
      message: "Indicate how often the event repeats",
    });
  }

  if (ctx.value.monthlyPattern === "dayInMonth") {
    if (ctx.value.monthDayValue === "" || ctx.value.monthDayValue === "0") {
      ctx.issues.push({
        code: "custom",
        input: ctx.value,
        path: ["monthDayValue"],
        message: "You must pick a day",
      });
    }
  }

  if (ctx.value.monthlyPattern === "patternInMonth") {
    if (ctx.value.monthPeriodValue === "") {
      ctx.issues.push({
        code: "custom",
        input: ctx.value,
        path: ["monthPeriodValue"],
        message: "You must pick a period",
      });
    }
    if (ctx.value.monthWeekdayValue === "") {
      ctx.issues.push({
        code: "custom",
        input: ctx.value,
        path: ["monthWeekdayValue"],
        message: "You must select a weekday",
      });
    }
  }
};

const verifyYearlyPattern = (ctx: any) => {
  if (ctx.value.yearlyPattern === "") {
    ctx.issues.push({
      code: "custom",
      input: ctx.value,
      path: ["yearlyPattern"],
      message: "Pick a repeating pattern from the available options",
    });
  }

  if (ctx.value.yearValue === "" || ctx.value.yearValue === "0") {
    ctx.issues.push({
      code: "custom",
      input: ctx.value,
      path: ["yearValue"],
      message: "Indicate how often the event repeats",
    });
  }

  if (ctx.value.yearlyPattern === "dayInMonthInYear") {
    if (ctx.value.yearDayValue === "" || ctx.value.yearDayValue === "0") {
      ctx.issues.push({
        code: "custom",
        input: ctx.value,
        path: ["yearDayValue"],
        message: "You must pick a day",
      });
    }
    if (ctx.value.yearMonthValue === "") {
      ctx.issues.push({
        code: "custom",
        input: ctx.value,
        path: ["yearMonthValue"],
        message: "You must select a month",
      });
    }
  }

  if (ctx.value.yearlyPattern === "patternInMonthInYear") {
    if (ctx.value.yearPeriodValue === "") {
      ctx.issues.push({
        code: "custom",
        input: ctx.value,
        path: ["yearPeriodValue"],
        message: "You must pick a period",
      });
    }
    if (ctx.value.yearWeekdayValue === "") {
      ctx.issues.push({
        code: "custom",
        input: ctx.value,
        path: ["yearWeekdayValue"],
        message: "You must select a weekday",
      });
    }
    if (ctx.value.yearMonthValue === "") {
      ctx.issues.push({
        code: "custom",
        input: ctx.value,
        path: ["yearMonthValue"],
        message: "You must select a month",
      });
    }
  }
};

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
    userId: z.string().refine(
      (value) => {
        return value !== "" && !isNaN(Number(value)) && Number(value) > 0;
      },
      {
        message: "Please select a Member",
      }
    ),
    description: z.string().optional(),
    title: z.string().min(1),
    statusId: z.string(),
    startDate: z.string(),
    endDate: z.string(),
    recurrenceId: z.string().optional(),
    duration: z.string(),
    isRecurring: z.string(),
  })
  .check((ctx) => {
    const EndDate = new Date(ctx.value.startDate);
    const StartDate = new Date(ctx.value.endDate);

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

    if (EndDate.getTime() < StartDate.getTime()) {
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

export const eventObject = z.object({
  eventId: z
    .string()
    .transform((val) => Number(val))
    .optional(),
  roomId: z.string().transform((val) => Number(val)),
  userId: z.string().transform((val) => Number(val)),
  startDate: z.date(),
  endDate: z.date(),
  title: z.string(),
  description: z.string(),
  recurrenceId: z
    .string()
    .transform((val) => Number(val))
    .optional(),
});

export const ruleObject = z.object({
  rule: z.string().min(1, "Please define a recurrence rule"),
  ruleStartDate: z.string().transform((val) => new Date(val)),
  ruleEndDate: z.string().transform((val) => new Date(val)),
});

export const CombinedEventSchema = step1Schema.extend(step2Schema.shape);

export type CombinedSchema = z.infer<typeof CombinedEventSchema>;

export const defaultValues = (creationDate?: Date, userId?: string): CombinedSchema => {
  const startDateTime = getValidMinuteAndRolledHour(creationDate ? creationDate : new Date());

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
    startDate: event.startDate.toISOString(),
    endDate: event.endDate.toISOString(),
    duration: getDurationText(event.startDate.toISOString(), event.endDate.toISOString()),
    isRecurring: event.recurrenceId ? "true" : "false",
    recurrenceId: event.recurrenceId ? String(event.recurrenceId) : "",
  };

  const SRecurrenceDefaults: z.infer<typeof step2Schema> = {
    rule: event.recurrence ? event.recurrence.rule : "",
    ruleStartDate: event.recurrence ? event.recurrence.startDate.toISOString() : event.startDate.toISOString(),
    ruleEndDate: event.recurrence ? event.recurrence.endDate.toISOString() : event.endDate.toISOString(),
    untilDate: event.recurrence ? event.recurrence.endDate.toISOString() : event.endDate.toISOString(),
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
  //console.log(event.recurrence?.startDate);
  //console.log(SRecurrenceDefaults.ruleStartDate);

  if (event.recurrence) {
    parseRRule(event.recurrence.rule, SRecurrenceDefaults);
  }

  //console.log(SRecurrenceDefaults.ruleStartDate);

  return { ...SEventFormDefaults, ...SRecurrenceDefaults };
};

function parseRRule(value: string, SRecurrenceDefaults: z.infer<typeof step2Schema>) {
  const rrule: RRule = rrulestr(value);
  const test = rrule.toString();
  //SRecurrenceDefaults.rule = rrule.toString();
  //SRecurrenceDefaults.ruleStartDate = format(convertRRuleDateToDate(rrule.options.dtstart), "yyyy-MM-dd");
  //SRecurrenceDefaults.ruleEndDate = format(convertRRuleDateToDate(getEndDate(rrule)), "yyyy-MM-dd");
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
    SRecurrenceDefaults.dailyPattern = rrule.options.byweekday ? "weekdays" : "daily";
    SRecurrenceDefaults.dayValue =
      rrule.options.interval && !rrule.options.byweekday ? String(rrule.options.interval) : "";
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
