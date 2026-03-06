import { addYears } from "date-fns";
import { ByWeekday, RRule } from "rrule";
import { CombinedSchema } from "./event-drawer.validator";

export function getRRuleData({
  startDate,
  fieldValues,
}: {
  startDate: string;
  fieldValues: RRuleFieldValues;
}): Promise<{
  RRuleText: string;
  ruleString: string;
  firstDate: string;
  lastDate: string;
  count: number;
  localDates: Date[];
}> {
  const rule = createRRule(startDate, ...fieldValues);
  const RRuleText = rule ? rule.toText() : "Incomplete Recurrence Pattern";
  const RRuleOptions = rule?.options;

  if (!RRuleOptions) {
    return Promise.reject("Invalid Pattern");
  }

  return new Promise((resolve, reject) => {
    const worker = new Worker(new URL("./rrule-preview-webworker.ts", import.meta.url));

    worker.onmessage = (event) => {
      resolve({
        RRuleText,
        ...event.data,
      });
      worker.terminate();
    };

    worker.onerror = (err) => {
      reject(err);
      worker.terminate();
    };

    worker.postMessage(RRuleOptions);
  });
}
/*
export function getRRuleDataWithCallback({
  startDate,
  fieldValues,
  onComplete,
  onError,
}: {
  startDate: string;
  fieldValues: RRuleFieldValues;
  onComplete: (data: {
    RRuleText: string;
    ruleString?: string;
    lastDate?: string;
    count?: number;
    localDates?: Date[];
  }) => void;
  onError?: (error: unknown) => void;
}) {
  const rule = createRRule(startDate, ...fieldValues);
  const RRuleText = rule ? rule.toText() : "Incomplete Recurrence Pattern";
  const RRuleOptions = rule?.options;

  if (!RRuleOptions) {
    onComplete({ RRuleText });
    return;
  }

  const worker = new Worker(new URL("./rrule-preview-webworker.ts", import.meta.url));

  worker.onmessage = (response: MessageEvent<{ rrule: RRule; count: number; lastDate: Date; localDates: Date[] }>) => {
    try {
      const strippedObject = response.data.rrule;
      const original = Object.getPrototypeOf(new RRule());
      Object.setPrototypeOf(strippedObject, original);

      const ruleString = strippedObject.toString();
      const lastDate = response.data.lastDate.toISOString();
      const count = response.data.count;
      const localDates = response.data.localDates;

      onComplete({
        RRuleText,
        ruleString,
        lastDate,
        count,
        localDates,
      });
    } catch (err) {
      onError?.(err);
    } finally {
      worker.terminate();
    }
  };

  worker.onerror = (err) => {
    onError?.(err);
    worker.terminate();
  };

  worker.postMessage(RRuleOptions);
}*/

function IsDateLessThenEqual(firstDate: Date, secondDate: Date | null) {
  if (!secondDate) {
    return true;
  }
  if (
    firstDate.getFullYear() >= secondDate.getFullYear() &&
    firstDate.getMonth() >= secondDate.getMonth() &&
    firstDate.getDate() >= secondDate.getDate()
  ) {
    return true;
  }
  return false;
}

function createRRule(
  ruleStartDate: string,
  untilDate: string,
  repeatingType: string,
  weekdays: string[],
  dailyPattern: string,
  monthlyPattern: string,
  yearlyPattern: string,
  dayValue: string,
  weekValue: string,
  monthValue: string,
  monthDayValue: string,
  monthPeriodValue: string,
  monthWeekdayValue: string,
  yearValue: string,
  yearDayValue: string,
  yearMonthValue: string,
  yearPeriodValue: string,
  yearWeekdayValue: string,
  occurrences: string,
  durationType: string,
) {
  const repeatingPattern = getRepeatingPatternValue(repeatingType, dailyPattern, monthlyPattern, yearlyPattern);
  const weekdayArray = getWeekdayArray(repeatingPattern, weekdays, monthWeekdayValue, yearWeekdayValue);

  const dayInterval = parseNumber(dayValue);
  const weekInterval = parseNumber(weekValue);
  const monthInterval = parseNumber(monthValue);
  const yearInterval = parseNumber(yearValue);

  const monthByMonthDay = parseNumber(monthDayValue);
  const monthBySetPos = parseNumber(monthPeriodValue);

  const yearByMonth = parseNumber(yearMonthValue);
  const yearBySetPos = parseNumber(yearPeriodValue);

  const yearByYearDay = parseNumber(yearDayValue);

  const parsedStartDate = new Date(ruleStartDate); // parse(ruleStartDate, "yyyy-MM-dd", new Date());
  //const parsedEndDate = new Date(ruleEndDate); //parse(ruleEndDate, "yyyy-MM-dd", new Date(ruleEndDate));

  const count = durationType === "forever" || durationType === "until" ? null : parseNumber(occurrences);
  const convertedEndDate =
    durationType === "forever"
      ? addYears(parsedStartDate, 200) //convertDateToRRuleDate(addYears(parsedStartDate, 200))
      : durationType === "count"
        ? null
        : new Date(untilDate); //convertDateToRRuleDate(parsedEndDate);

  if (
    (durationType === "count" && count === 0) ||
    (durationType === "until" && IsDateLessThenEqual(parsedStartDate, convertedEndDate))
  ) {
    return;
  }

  switch (repeatingPattern) {
    case "daily-daily":
      if (dayInterval <= 0) return;
      break;
    case "daily-weekdays":
      break;
    case "weekly-weekly":
      if (weekInterval <= 0) return;
      break;
    case "monthly-dayInMonth":
      if (monthInterval <= 0) return;
      if (monthByMonthDay <= 0) return;
      break;
    case "monthly-patternInMonth":
      if (monthInterval <= 0) return;
      if (monthBySetPos !== -1 && monthBySetPos <= 0) return;
      break;
    case "yearly-dayInMonthInYear":
      if (yearInterval <= 0) return;
      if (yearByMonth <= 0 || yearByYearDay <= 0) return;
      break;
    case "yearly-patternInMonthInYear":
      if (yearInterval <= 0) return;
      if (weekdayArray.length <= 0 || yearByMonth <= 0 || (yearBySetPos !== -1 && yearBySetPos <= 0)) return;
      break;
  }

  switch (repeatingPattern) {
    case "daily-daily":
      return new RRule({
        freq: RRule.DAILY,
        interval: dayInterval,
        byweekday: weekdayArray,
        dtstart: parsedStartDate,
        count: count,
        until: convertedEndDate,
      });
    case "daily-weekdays":
      return new RRule({
        freq: RRule.DAILY,
        interval: Number(1),
        byweekday: weekdayArray,
        dtstart: parsedStartDate,
        count: count,
        until: convertedEndDate,
      });

    case "weekly-weekly":
      return new RRule({
        freq: RRule.WEEKLY,
        interval: weekInterval,
        byweekday: weekdayArray,
        dtstart: parsedStartDate,
        count: count,
        until: convertedEndDate,
      });
      break;
    case "monthly-dayInMonth":
      return new RRule({
        freq: RRule.MONTHLY,
        interval: monthInterval,
        bymonthday: monthByMonthDay,
        dtstart: parsedStartDate,
        count: count,
        until: convertedEndDate,
      });
    case "monthly-patternInMonth":
      return new RRule({
        freq: RRule.MONTHLY,
        interval: monthInterval,
        byweekday: weekdayArray,
        bysetpos: monthBySetPos,
        dtstart: parsedStartDate,
        count: count,
        until: convertedEndDate,
      });
    case "yearly-dayInMonthInYear":
      return new RRule({
        freq: RRule.YEARLY,
        interval: yearInterval,
        bymonth: yearByMonth,
        bymonthday: yearByYearDay,
        dtstart: parsedStartDate,
        count: count,
        until: convertedEndDate,
      });
      break;
    case "yearly-patternInMonthInYear":
      return new RRule({
        freq: RRule.YEARLY,
        interval: yearInterval,
        bysetpos: yearBySetPos,
        byweekday: weekdayArray,
        bymonth: yearByMonth,
        dtstart: parsedStartDate,
        count: count,
        until: convertedEndDate,
      });
      break;
  }
}

function createRRule2(
  ruleStartDate: string,
  untilDate: string,
  repeatingType: string,
  weekdays: string[],
  dailyPattern: string,
  monthlyPattern: string,
  yearlyPattern: string,
  dayValue: string,
  weekValue: string,
  monthValue: string,
  monthDayValue: string,
  monthPeriodValue: string,
  monthWeekdayValue: string,
  yearValue: string,
  yearDayValue: string,
  yearMonthValue: string,
  yearPeriodValue: string,
  yearWeekdayValue: string,
  occurrences: string,
  durationType: string,
) {
  const repeatingPattern = getRepeatingPatternValue(repeatingType, dailyPattern, monthlyPattern, yearlyPattern);
  const weekdayArray = getWeekdayArray(repeatingPattern, weekdays, monthWeekdayValue, yearWeekdayValue);

  // Common parsed values
  const parsedStartDate = new Date(ruleStartDate);
  const count = durationType === "forever" || durationType === "until" ? null : parseNumber(occurrences);

  const convertedEndDate =
    durationType === "forever" ? addYears(parsedStartDate, 200) : durationType === "count" ? null : new Date(untilDate);

  // Initial Guard
  if (
    (durationType === "count" && count === 0) ||
    (durationType === "until" && IsDateLessThenEqual(parsedStartDate, convertedEndDate))
  ) {
    return;
  }

  // Base options shared by all rules
  const baseOptions = {
    dtstart: parsedStartDate,
    count: count ?? undefined,
    until: convertedEndDate ?? undefined,
  };

  // Helper to safely parse intervals
  const intervals = {
    day: parseNumber(dayValue),
    week: parseNumber(weekValue),
    month: parseNumber(monthValue),
    year: parseNumber(yearValue),
  };

  switch (repeatingPattern) {
    case "daily-daily":
      if (intervals.day <= 0) return;
      return new RRule({ ...baseOptions, freq: RRule.DAILY, interval: intervals.day, byweekday: weekdayArray });

    case "daily-weekdays":
      return new RRule({ ...baseOptions, freq: RRule.DAILY, interval: 1, byweekday: weekdayArray });

    case "weekly-weekly":
      if (intervals.week <= 0) return;
      return new RRule({ ...baseOptions, freq: RRule.WEEKLY, interval: intervals.week, byweekday: weekdayArray });

    case "monthly-dayInMonth": {
      const day = parseNumber(monthDayValue);
      if (intervals.month <= 0 || day <= 0) return;
      return new RRule({ ...baseOptions, freq: RRule.MONTHLY, interval: intervals.month, bymonthday: day });
    }

    case "monthly-patternInMonth": {
      const pos = parseNumber(monthPeriodValue);
      if (intervals.month <= 0 || (pos !== -1 && pos <= 0)) return;
      return new RRule({
        ...baseOptions,
        freq: RRule.MONTHLY,
        interval: intervals.month,
        byweekday: weekdayArray,
        bysetpos: pos,
      });
    }

    case "yearly-dayInMonthInYear": {
      const month = parseNumber(yearMonthValue);
      const day = parseNumber(yearDayValue);
      if (intervals.year <= 0 || month <= 0 || day <= 0) return;
      return new RRule({
        ...baseOptions,
        freq: RRule.YEARLY,
        interval: intervals.year,
        bymonth: month,
        bymonthday: day,
      });
    }

    case "yearly-patternInMonthInYear": {
      const month = parseNumber(yearMonthValue);
      const pos = parseNumber(yearPeriodValue);
      if (intervals.year <= 0 || month <= 0 || (pos !== -1 && pos <= 0) || weekdayArray.length === 0) return;
      return new RRule({
        ...baseOptions,
        freq: RRule.YEARLY,
        interval: intervals.year,
        bymonth: month,
        byweekday: weekdayArray,
        bysetpos: pos,
      });
    }

    default:
      return;
  }
}

function parseNumber(value: string, defaultValue: number = 0) {
  const newValue = Number(value);
  return isNaN(newValue) ? defaultValue : newValue;
}

function getRepeatingPatternValue(
  repeatingType: string,
  dailyPattern: string,
  monthlyPattern: string,
  yearlyPattern: string,
) {
  const pattern =
    repeatingType === "daily"
      ? dailyPattern
      : repeatingType === "monthly"
        ? monthlyPattern
        : repeatingType === "yearly"
          ? yearlyPattern
          : repeatingType === "weekly"
            ? "weekly"
            : "";

  return repeatingType + "-" + pattern;
}

function getWeekdayArray(
  repeatingPattern: string,
  weekdays: string[],
  monthWeekdayValue: string,
  yearWeekdayValue: string,
) {
  let localWeekdays: string[] = [];
  const weekdayArray: ByWeekday[] = [];

  switch (repeatingPattern) {
    case "daily-weekdays":
      localWeekdays.push("weekday");
      break;
    case "weekly-weekly":
      if (weekdays.length > 0) localWeekdays = weekdays;
      if (weekdays.length === 0) localWeekdays.push("monday");

      break;
    case "monthly-patternInMonth":
      localWeekdays.push(monthWeekdayValue);

      break;
    case "yearly-patternInMonthInYear":
      localWeekdays.push(yearWeekdayValue);
      break;
  }

  if (localWeekdays.some((weekday) => ["monday", "day", "weekday"].includes(weekday))) weekdayArray.push(RRule.MO);
  if (localWeekdays.some((weekday) => ["tuesday", "day", "weekday"].includes(weekday))) weekdayArray.push(RRule.TU);
  if (localWeekdays.some((weekday) => ["wednesday", "day", "weekday"].includes(weekday))) weekdayArray.push(RRule.WE);
  if (localWeekdays.some((weekday) => ["thursday", "day", "weekday"].includes(weekday))) weekdayArray.push(RRule.TH);
  if (localWeekdays.some((weekday) => ["friday", "day", "weekday"].includes(weekday))) weekdayArray.push(RRule.FR);
  if (localWeekdays.some((weekday) => ["saturday", "day", "weekend"].includes(weekday))) weekdayArray.push(RRule.SA);
  if (localWeekdays.some((weekday) => ["sunday", "day", "weekend"].includes(weekday))) weekdayArray.push(RRule.SU);

  return weekdayArray;
}

export type RRuleFieldValues = [
  string, // untilDate
  string, // repeatingType
  string[], // weekdays
  string, // dailyPattern
  string, // monthlyPattern
  string, // yearlyPattern
  string, // dayValue
  string, // weekValue
  string, // monthValue
  string, // monthDayValue
  string, // monthPeriodValue
  string, // monthWeekdayValue
  string, // yearValue
  string, // yearDayValue
  string, // yearMonthValue
  string, // yearPeriodValue
  string, // yearWeekdayValue
  string, // occurrences
  string, // durationType
];

export function getFieldValuesArray(formValues: CombinedSchema): RRuleFieldValues {
  const fieldNames = [
    "untilDate",
    "repeatingType",
    "weekdays",
    "dailyPattern",
    "monthlyPattern",
    "yearlyPattern",
    "dayValue",
    "weekValue",
    "monthValue",
    "monthDayValue",
    "monthPeriodValue",
    "monthWeekdayValue",
    "yearValue",
    "yearDayValue",
    "yearMonthValue",
    "yearPeriodValue",
    "yearWeekdayValue",
    "occurrences",
    "durationType",
  ];

  return fieldNames.map((key) => formValues[key as keyof CombinedSchema]) as RRuleFieldValues;
}
