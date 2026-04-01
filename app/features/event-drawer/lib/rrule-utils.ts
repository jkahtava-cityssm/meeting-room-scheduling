export const WEEKDAY_MAP: Record<number, string> = {
  0: "monday",
  1: "tuesday",
  2: "wednesday",
  3: "thursday",
  4: "friday",
  5: "saturday",
  6: "sunday",
};

export const RECURRENCE_TYPES = ["daily", "weekly", "monthly", "yearly", ""] as const;
export const DURATION_TYPES = ["until", "forever", "count", ""] as const;

export type FlatRRuleSchema = z.infer<typeof BaseRecurrence> & {
  repeatingType?: string;
  dailyPattern?: string;
  dayValue?: string;
  weekValue?: string;
  weekdays?: string[];
  monthlyPattern?: string;
  monthValue?: string;
  monthDayValue?: string;
  monthPeriodValue?: string;
  monthWeekdayValue?: string;
  yearlyPattern?: string;
  yearValue?: string;
  yearMonthValue?: string;
  yearDayValue?: string;
  yearPeriodValue?: string;
  yearWeekdayValue?: string;
};

import { RRule, rrulestr } from "rrule";
import { differenceInYears, endOfDay, startOfDay } from "date-fns";
import { BaseRecurrence, DurationType } from "../drawer-schema.validator";
import z from "zod/v4";

export function getDurationType(rrule: RRule): DurationType {
  if (rrule.options.count) return "count";

  const endDate = rrule.options.until || new Date("9999-12-31");
  const startDate = rrule.options.dtstart;
  const diff = differenceInYears(endOfDay(endDate), startOfDay(startDate));

  return diff >= 200 ? "forever" : "until";
}

export function parseRRule(ruleString: string, defaults: FlatRRuleSchema): FlatRRuleSchema {
  const rrule = rrulestr(ruleString);

  // 1. Generic values shared by all types
  const result: FlatRRuleSchema = {
    ...defaults,
    rule: ruleString,
    durationType: getDurationType(rrule),
    occurrences: rrule.options.count ? String(rrule.options.count) : "",
    weekdays: rrule.options.byweekday?.map((v) => WEEKDAY_MAP[v]) || [],
  };

  // 2. Frequency-specific mappings
  const freq = rrule.options.freq;

  if (freq === RRule.DAILY) {
    result.repeatingType = "daily";
    result.dailyPattern = rrule.options.byweekday ? "weekdays" : "daily";
    result.dayValue = rrule.options.interval && !rrule.options.byweekday ? String(rrule.options.interval) : "";
  } else if (freq === RRule.WEEKLY) {
    result.repeatingType = "weekly";
    result.weekValue = String(rrule.options.interval || "");
  } else if (freq === RRule.MONTHLY) {
    result.repeatingType = "monthly";
    result.monthValue = String(rrule.options.interval || "");
    result.monthlyPattern = rrule.options.bymonthday ? "dayInMonth" : "patternInMonth";
    result.monthDayValue = String(rrule.options.bymonthday || "");
    result.monthPeriodValue = String(rrule.options.bysetpos || "");
    result.monthWeekdayValue = String(rrule.options.byweekday?.[0] || "");
  } else if (freq === RRule.YEARLY) {
    result.repeatingType = "yearly";
    result.yearValue = String(rrule.options.interval || "");
    result.yearMonthValue = String(rrule.options.bymonth?.[0] || "");
    result.yearlyPattern = rrule.options.bymonthday ? "dayInMonthInYear" : "patternInMonthInYear";
    result.yearDayValue = String(rrule.options.bymonthday || "");
    result.yearPeriodValue = String(rrule.options.bysetpos || "");
    result.yearWeekdayValue = String(rrule.options.byweekday?.[0] || "");
  }

  return result as FlatRRuleSchema;
}
