import { IEvent } from "@/lib/schemas/calendar";
import { addMinutes, differenceInYears, endOfDay, startOfDay } from "date-fns";
import { z } from "zod/v4";

import { RRule, rrulestr } from "rrule";
import { getValidMinuteAndRolledHour } from "./lib/form-helper";
import { getDurationText } from "@/lib/helpers";

export const DURATION_OPTIONS = ["until", "forever", "count", ""] as const;

// 1. Define the Shared Fields (things every recurrence has)
export const BaseRecurrence = z.object({
  rule: z.string().min(1, "Please define a recurrence rule"),
  ruleStartDate: z.string(),
  ruleEndDate: z.string(),
  untilDate: z.string(),
  durationType: z.enum(DURATION_OPTIONS),
  occurrences: z.string(),
});

// 2. Define the Specific Patterns
const Daily = z.object({
  repeatingType: z.literal("daily"),
  dailyPattern: z.string().min(1, "You must choose an option"),
  dayValue: z.string().min(1, "Indicate frequency"),
});

const Weekly = z.object({
  repeatingType: z.literal("weekly"),
  weekValue: z.string().min(1, "Indicate frequency"),
  weekdays: z.array(z.string()).min(1, "Please select at least one weekday"),
});

const Monthly = z.object({
  repeatingType: z.literal("monthly"),
  monthlyPattern: z.enum(["dayInMonth", "patternInMonth"]),
  monthValue: z.string().min(1),
  monthDayValue: z.string().optional(),
  monthPeriodValue: z.string().optional(),
  monthWeekdayValue: z.string().optional(),
});

const Yearly = z.object({
  repeatingType: z.literal("yearly"),
  yearlyPattern: z.enum(["dayInMonthInYear", "patternInMonthInYear"]),
  yearValue: z.string().min(1),
  yearMonthValue: z.string().min(1, "Select a month"),
  yearDayValue: z.string().optional(),
  yearPeriodValue: z.string().optional(),
  yearWeekdayValue: z.string().optional(),
});

// 3. Combine them using Discriminated Union
export const step2Schema = z
  .intersection(BaseRecurrence, z.discriminatedUnion("repeatingType", [Daily, Weekly, Monthly, Yearly]))
  .check((ctx) => {
    const val = ctx.value;
    const report = (path: string[], message: string) => ctx.issues.push({ code: "custom", input: val, path, message });

    if (val.durationType === "") {
      report(["durationType"], "Please select a duration type");
    }
    // Simplified Duration Checks
    if (["until", "forever"].includes(val.durationType) && !val.ruleEndDate) {
      report(["ruleEndDate"], "Please Specify an End Date");
    }
    if (val.durationType === "count" && (!val.occurrences || val.occurrences === "0")) {
      report(["occurrences"], "Enter occurrences");
    }

    // Monthly/Yearly pattern checks (much cleaner now)
    if (val.repeatingType === "monthly") {
      if (val.monthlyPattern === "dayInMonth" && !val.monthDayValue) report(["monthDayValue"], "Pick a day");
      if (val.monthlyPattern === "patternInMonth" && (!val.monthPeriodValue || !val.monthWeekdayValue)) {
        report(["monthlyPattern"], "Complete the pattern fields");
      }
    }

    if (val.repeatingType === "yearly") {
      if (val.yearlyPattern === "dayInMonthInYear" && !val.yearDayValue) report(["yearDayValue"], "Pick a day");
      if (val.yearlyPattern === "patternInMonthInYear" && (!val.yearPeriodValue || !val.yearWeekdayValue)) {
        report(["yearlyPattern"], "Complete the pattern fields");
      }
    }
  });
// --- Step 1 Schema ---
export const step1Schema = z
  .object({
    eventId: z.string().optional(),
    roomId: z.string().refine((v) => v !== "" && !isNaN(Number(v)) && Number(v) > 0, "Please select a Room"),
    userId: z.string().refine((v) => v !== "" && !isNaN(Number(v)) && Number(v) > 0, "Please select a Member"),
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
    const val = ctx.value;
    const start = new Date(val.startDate);
    const end = new Date(val.endDate);

    if (end < start) {
      ctx.issues.push({ code: "custom", input: val, path: ["startDate"], message: "Start Date exceeds End Date" });
      ctx.issues.push({ code: "custom", input: val, path: ["endDate"], message: "End Date precedes Start Date" });
    }
  });

export type DurationType = z.infer<typeof BaseRecurrence>["durationType"];
export type Step1Schema = z.infer<typeof step1Schema>;
export type Step2Schema = z.infer<typeof step2Schema>;

export const CombinedEventSchema = step1Schema.and(step2Schema);

export type CombinedSchema = z.infer<typeof CombinedEventSchema>;

export const Step2Fields = BaseRecurrence.extend(Daily.shape)
  .extend(Weekly.shape)
  .extend(Monthly.shape)
  .extend(Yearly.shape);

export type FlatCombinedSchema = z.infer<typeof step1Schema> & z.infer<typeof Step2Fields>;
