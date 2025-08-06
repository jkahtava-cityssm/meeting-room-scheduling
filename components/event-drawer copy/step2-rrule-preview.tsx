import { useEffect, useMemo, useRef, useState } from "react";
import { Control, UseFormReturn, useWatch } from "react-hook-form";
import { RRule } from "rrule";
import { ByWeekday } from "rrule/dist/esm/types";
import { IRecurrenceForm } from "./dialog-event-form-step-2";
import { convertDateToRRuleDate } from "@/lib/helpers";
import { ScrollArea, ScrollBar } from "../ui/scroll-area";
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from "../ui/table";
import { addYears, format, parse } from "date-fns";
import { Skeleton } from "../ui/skeleton";
import z from "zod/v4";
import { step2Schema } from "./event-flow.validator";

export function RRulePreview({
  startDate,
  control,
  setLastDate,
}: {
  startDate: string;
  control: Control<z.infer<typeof step2Schema>>;
  setLastDate: (value: Date) => void;
}) {
  const [rrule, setRRule] = useState<RRule>();
  const [count, setCount] = useState<number>();

  const [localDates, setLocalDates] = useState<Date[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const workerRef = useRef<Worker | null>(null);
  const fieldValues = useWatch({
    control: control,
    name: [
      "endDate",
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
    ],
  });

  const { RRuleText, RRuleOptions } = useMemo(() => {
    const rule = createRRule(startDate, ...fieldValues);
    const text = rule ? rule.toText() : "Incomplete Recurrence Pattern";
    const options = rule?.options;
    return { RRuleText: text, RRuleOptions: options };
  }, [fieldValues, startDate]);

  useEffect(() => {
    if (workerRef.current) {
      return;
    }

    const newWorker = new Worker(new URL("../event-drawer/dialog-event-form-webworker.ts", import.meta.url));

    newWorker.onmessage = (
      response: MessageEvent<{ rrule: RRule; count: number; lastDate: Date; localDates: Date[] }>
    ) => {
      if (response.data) {
        const strippedObject = response.data.rrule;
        const original = Object.getPrototypeOf(new RRule());
        Object.setPrototypeOf(strippedObject, original);

        setLocalDates(response.data.localDates);
        setRRule(strippedObject);
        setCount(response.data.count);

        //setValue("lastOccurrenceDate", response.data.lastDate);
        //setLastDate(response.data.lastDate);

        setIsLoading(false);
      }
    };

    workerRef.current = newWorker;

    return () => {
      if (workerRef.current) {
        //console.log("Terminate");
        workerRef.current.terminate();
        workerRef.current = null;
      }
    };
  }, [RRuleOptions]);

  useEffect(() => {
    if (!RRuleOptions) {
      return;
    }

    if (workerRef.current) {
      setIsLoading(true);
      workerRef.current.postMessage(RRuleOptions);
    }
  }, [RRuleOptions]);

  /*if (rrule) {
    form.setValue("rule", rrule ? rrule.toString() : "");
  }*/

  const total = count?.toLocaleString(); //RRule?.count();
  //const convertedRuleList = ruleList.map(convertRRuleDateToDate);

  //console.log(isLoading);

  if (isLoading || !RRuleOptions) {
    return (
      <div className="flex flex-col gap-1">
        <Skeleton className="h-9"></Skeleton>
        <Skeleton className="h-60">
          <div className="flex flex-1 justify-center items-center h-60">{RRuleText}</div>
        </Skeleton>
        <Skeleton className="h-9"></Skeleton>
      </div>
    );
  }

  return (
    <ScrollArea className="h-80" type="always">
      <div className=" min-h-80 max-h-80">
        <div className="flex flex-col gap-2">
          <Table className="min-h-80">
            <TableHeader>
              <TableRow>
                <TableHead className="w-8">#</TableHead>
                <TableHead className="w-27">Weekday</TableHead>
                <TableHead className="w-20">Month</TableHead>
                <TableHead className="w-11">Day</TableHead>
                <TableHead className="w-13">Year</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {localDates.map((value, index) => {
                return (
                  <TableRow key={index}>
                    <TableCell className="w-8">{index + 1}</TableCell>
                    <TableCell className="w-27">{format(value, "EEEE")}</TableCell>
                    <TableCell className="w-20">{format(value, "MMMM")}</TableCell>
                    <TableCell className="w-11">{format(value, "do")}</TableCell>
                    <TableCell className="w-13">{format(value, "yyyy")}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
            <TableFooter>
              <TableRow>
                <TableCell colSpan={5}>
                  Previewing {localDates.length} of {total} events in series
                </TableCell>
              </TableRow>
            </TableFooter>
          </Table>
        </div>
      </div>
      <ScrollBar orientation="vertical" forceMount></ScrollBar>
    </ScrollArea>
  );
}

function createRRule(
  startDate: string,
  endDate: string,
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
  durationType: string
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

  const parsedStartDate = parse(startDate, "yyyy-MM-dd", new Date());
  const parsedEndDate = parse(endDate, "yyyy-MM-dd", new Date());

  const convertedStartDate = convertDateToRRuleDate(parsedStartDate);

  const count = durationType === "forever" || durationType === "until" ? null : parseNumber(occurrences);
  const convertedEndDate =
    durationType === "forever"
      ? convertDateToRRuleDate(addYears(parsedStartDate, 200))
      : durationType === "count"
      ? null
      : convertDateToRRuleDate(parsedEndDate);

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
        dtstart: convertedStartDate,
        count: count,
        until: convertedEndDate,
      });
    case "daily-weekdays":
      return new RRule({
        freq: RRule.DAILY,
        interval: Number(1),
        byweekday: weekdayArray,
        dtstart: convertedStartDate,
        count: count,
        until: convertedEndDate,
      });

    case "weekly-weekly":
      return new RRule({
        freq: RRule.WEEKLY,
        interval: weekInterval,
        byweekday: weekdayArray,
        dtstart: convertedStartDate,
        count: count,
        until: convertedEndDate,
      });
      break;
    case "monthly-dayInMonth":
      return new RRule({
        freq: RRule.MONTHLY,
        interval: monthInterval,
        bymonthday: monthByMonthDay,
        dtstart: convertedStartDate,
        count: count,
        until: convertedEndDate,
      });
    case "monthly-patternInMonth":
      return new RRule({
        freq: RRule.MONTHLY,
        interval: monthInterval,
        byweekday: weekdayArray,
        bysetpos: monthBySetPos,
        dtstart: convertedStartDate,
        count: count,
        until: convertedEndDate,
      });
    case "yearly-dayInMonthInYear":
      return new RRule({
        freq: RRule.YEARLY,
        interval: yearInterval,
        bymonth: yearByMonth,
        bymonthday: yearByYearDay,
        dtstart: convertedStartDate,
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
        dtstart: convertedStartDate,
        count: count,
        until: convertedEndDate,
      });
      break;
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
  yearlyPattern: string
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
  yearWeekdayValue: string
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
