"use client";

import { Form, FormField, FormLabel, FormItem, FormControl, FormMessage } from "@/components/ui/form";
import { Select, SelectItem, SelectContent, SelectTrigger, SelectValue } from "@/components/ui/select";

import { IRecurrence, SRecurrence } from "@/lib/schemas/calendar";
import { Control, FieldPathByValue, FieldValues, useForm, UseFormReturn, useWatch } from "react-hook-form";
import { z } from "zod/v4";
import { zodResolver } from "@hookform/resolvers/zod";
import { RadioGroup, RadioGroupItem } from "../ui/radio-group";
import InputNumber from "../ui/input-number";
import { Checkbox } from "../ui/checkbox";
import { Separator } from "../ui/separator";
import { ByWeekday } from "rrule";

import { ScrollArea, ScrollBar } from "../ui/scroll-area";
import { useEventForm } from "@/contexts/EventFormProvider";
import { useEffect } from "react";
import { SingleDayPicker } from "../ui/single-day-picker";
import { RRulePreview } from "./dialog-event-form-useWebWorker";

export interface IRecurrenceForm extends Pick<IRecurrence, "rule" | "startDate" | "endDate"> {
  repeatingType: string;
  repeatingPattern: string;

  dailyPattern: string;
  monthlyPattern: string;
  yearlyPattern: string;

  dayValue: string;
  monthValue: string;
  monthDayValue: string;
  monthPeriodValue: string;
  monthWeekdayValue: string;
  yearValue: string;
  yearDayValue: string;
  yearMonthValue: string;
  yearPeriodValue: string;
  yearWeekdayValue: string;
  weekValue: string;
  weekdays: string[];

  durationType: string;
  occurrences: string;
  endDate: Date;
  duration?: string;
}

const SRecurrenceForm = z.object({
  ...SRecurrence.pick({ rule: true, startDate: true, endDate: true }).shape,
  repeatingType: z.string(),
  repeatingPattern: z.string(),
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
  endDate: z.coerce.date() as unknown as z.ZodDate,
  duration: z.string().optional(),
});

let render = 0;

const SRecurrenceFormDefaults = {
  repeatingType: "",
  repeatingPattern: "",
  rule: "",
  startDate: new Date(),
  endDate: new Date(),
  weekdays: ["monday"],
  dailyPattern: "",
  monthlyPattern: "",
  yearlyPattern: "",

  dayValue: "",
  weekValue: "",
  monthValue: "",
  monthDayValue: "",
  monthPeriodValue: "",
  monthWeekdayValue: "",
  yearValue: "",
  yearDayValue: "",
  yearMonthValue: "",
  yearPeriodValue: "",
  yearWeekdayValue: "",
  duration: "",
  durationType: "",
  occurrences: "",
};

export function UpdateRecurrenceForm({
  startDate,
  isLoading,
  onSubmit,
}: {
  startDate: Date;
  isLoading: boolean;
  onSubmit: (e: React.SyntheticEvent<EventTarget>) => void;
}) {
  /*const { getFormData } = useFormStep({
    schema: SRecurrenceForm,
    defaultValues: SRecurrenceFormDefaults,
    currentStep: 2,
  });

  const previousData = getFormData();*/

  const { setNextVisible, setBackVisible, setCurrentForm, setFormId, getFormData } = useEventForm();

  const form = useForm<IRecurrenceForm>({
    resolver: zodResolver(SRecurrenceForm),
    reValidateMode: "onSubmit",
    mode: "all",
    defaultValues: getFormData(SRecurrenceForm, SRecurrenceFormDefaults),
  });

  useEffect(() => {
    setCurrentForm(form);
    setFormId("recurring-form");
    setNextVisible(false);
    setBackVisible(true);
  }, [form, setBackVisible, setCurrentForm, setFormId, setNextVisible]);

  //const type = useWatch({ control: form.control, name: "repeatingType" });
  const type = form.watch("repeatingType");
  const durationType = form.watch("durationType");
  const monthPeriodSelected = form.watch("monthPeriodValue");
  const yearPeriodSelected = form.watch("yearPeriodValue");
  //const formValues = form.watch();

  //const results = useWatch({ control: form.control, name: ["monthValue", "monthDayValue"] });

  //const pattern = getPatternValue(formValues);
  //const weekdayArray = getWeekdayArray(formValues, pattern);
  //const newRule = createRRule(formValues, pattern, weekdayArray, new Date());

  if (isLoading) {
    return <>...Loading</>;
  }

  return (
    <Form {...form}>
      <form id="recurring-form">
        <ScrollArea type="always">
          <div className="h-[calc(40dvh)] w-full">
            <div className="flex flex-col gap-2">
              <div className="flex flex-col flex-1 gap-4 py-4 min-h-90">
                <div className="flex flex-row gap-2 w-100">
                  <FormField
                    control={form.control}
                    name="durationType"
                    render={({ field, fieldState }) => (
                      <FormItem>
                        <div className="flex flex-row gap-2">
                          <FormLabel id="typeLabel" htmlFor="repeatingType" className="min-w-15 justify-end">
                            Duration
                          </FormLabel>
                          <FormControl>
                            <Select
                              //{...field}
                              name={field.name}
                              value={field.value}
                              defaultValue={field.value}
                              key={field.value}
                              onValueChange={(value) => {
                                if (value === "") {
                                  //There is a Bug with the Select Field when used with React Hook Form:
                                  //https://github.com/radix-ui/primitives/issues/2944
                                  //https://github.com/radix-ui/primitives/issues/3135
                                  //We can also prevent this behaviour by forcing a re-render if we add the property key={field.value}
                                  //return;
                                }
                                field.onChange(value);
                              }}
                            >
                              <SelectTrigger id={field.name} data-invalid={fieldState.invalid} className={"min-w-40"}>
                                <SelectValue placeholder="Select an option" />
                              </SelectTrigger>

                              <SelectContent className={"min-w-40"}>
                                {durations.map((period) => {
                                  return (
                                    <SelectItem key={period.id} value={period.id} className="flex-1">
                                      {period.label}
                                    </SelectItem>
                                  );
                                })}
                              </SelectContent>
                            </Select>
                          </FormControl>
                          <FormMessage />
                        </div>
                      </FormItem>
                    )}
                  />
                  {durationType === "count" && (
                    <NumberFormInput control={form.control} name="occurrences"></NumberFormInput>
                  )}
                  {durationType === "until" && (
                    <FormField
                      control={form.control}
                      name="endDate"
                      render={({ field, fieldState }) => (
                        <FormItem className="space-y-3">
                          <FormControl>
                            <FormItem className="flex items-center gap-2">
                              <FormControl>
                                <SingleDayPicker
                                  id="endDate"
                                  value={field.value}
                                  onSelect={(date) => {
                                    field.onChange(date as Date);
                                  }}
                                  placeholder="Select a date"
                                  data-invalid={fieldState.invalid}
                                  className="w-52"
                                />
                              </FormControl>
                            </FormItem>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                </div>
                <FormField
                  control={form.control}
                  name="repeatingType"
                  render={({ field, fieldState }) => (
                    <FormItem>
                      <div className="flex flex-row gap-2">
                        <FormLabel id="typeLabel" htmlFor="repeatingType" className="min-w-15 justify-end">
                          Repeats
                        </FormLabel>
                        <FormControl>
                          <Select
                            //{...field}
                            name={field.name}
                            value={field.value}
                            defaultValue={field.value}
                            key={field.value}
                            onValueChange={(value) => {
                              if (value === "") {
                                //There is a Bug with the Select Field when used with React Hook Form:
                                //https://github.com/radix-ui/primitives/issues/2944
                                //https://github.com/radix-ui/primitives/issues/3135
                                //We can also prevent this behaviour by forcing a re-render if we add the property key={field.value}
                                //return;
                              }
                              field.onChange(value);
                            }}
                          >
                            <SelectTrigger id={field.name} data-invalid={fieldState.invalid} className={"min-w-40"}>
                              <SelectValue placeholder="Select an option" />
                            </SelectTrigger>

                            <SelectContent className={"min-w-40"}>
                              {repeatingPeriods.map((period) => {
                                return (
                                  <SelectItem key={period.id} value={period.id} className="flex-1">
                                    {period.label}
                                  </SelectItem>
                                );
                              })}
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormMessage />
                      </div>
                    </FormItem>
                  )}
                />
                {type === "daily" && <DailyForm form={form}></DailyForm>}
                {type === "weekly" && <WeeklyForm form={form}></WeeklyForm>}
                {type === "monthly" && <MonthlyForm form={form}></MonthlyForm>}
                {type === "yearly" && <YearlyForm form={form}></YearlyForm>}
              </div>
            </div>
          </div>
          <ScrollBar orientation="vertical" forceMount></ScrollBar>
        </ScrollArea>

        <DurationCalculation startDate={startDate} form={form} />

        {/*<div className="flex sm:flex-col-reverse md:flex-row md:justify-end gap-2 ">
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              moveBack(form.getValues());
            }}
          >
            Back
          </Button>
          <Button type="submit">Save</Button>
        </div>*/}
      </form>
    </Form>
  );
}
/*
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
  */

/*
function CreateRRule(
  { form }: { form: UseFormReturn<IRecurrenceForm, IRecurrenceForm> }
  
  startDate: Date,
  endDate: Date,
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
  const [
    repeatingType,
    weekdays,
    dailyPattern,
    monthlyPattern,
    yearlyPattern,
    dayValue,
    weekValue,
    monthValue,
    monthDayValue,
    monthPeriodValue,
    monthWeekdayValue,
    yearValue,
    yearDayValue,
    yearMonthValue,
    yearPeriodValue,
    yearWeekdayValue,
    endDate,
    occurrences,
    durationType,
  ] = useWatch({
    control: form.control,
    name: [
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
      "endDate",
      "occurrences",
      "durationType",
    ],
  });

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

  const convertedStartDate = startDate ? convertDateToRRuleDate(startDate) : convertDateToRRuleDate(new Date());

  const count = durationType === "forever" || durationType === "until" ? null : parseNumber(occurrences);
  const convertedEndDate =
    durationType === "forever" || durationType === "count" ? null : convertDateToRRuleDate(endDate);

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
*/
function DurationCalculation({
  startDate,
  form,
}: {
  startDate: Date;
  form: UseFormReturn<IRecurrenceForm, IRecurrenceForm>;
}) {
  /*
  const RRule = createRRule(
    new Date(),
    endDate,
    repeatingType,
    weekdays,
    dailyPattern,
    monthlyPattern,
    yearlyPattern,
    dayValue,
    weekValue,
    monthValue,
    monthDayValue,
    monthPeriodValue,
    monthWeekdayValue,
    yearValue,
    yearDayValue,
    yearMonthValue,
    yearPeriodValue,
    yearWeekdayValue,
    occurrences,
    durationType
  );
*/

  return RRulePreview(startDate, form);

  //console.log(count);
  /*if (rule) {
    form.setValue("rule", rule ? rule.toString() : "");

    console.log(rule.toString());
    const RuleText = rule ? rule.toText() : "";
  }

  const ruleList = rule
    ? rule?.all((date, len) => {
        return len < 500;
      })
    : [];

  const total = count; //RRule?.count();
  const convertedRuleList = ruleList.map(convertRRuleDateToDate);

  return (
    <ScrollArea key={total} className="h-80" type="always">
      <div className=" min-h-80 max-h-80">
        <div className="flex flex-col gap-2">
          {
            //<ScrollArea className={`min-h-80 max-h-80 ${convertedRuleList.length === 0 && "bg-secondary"}`} type="always">
          }
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
              {convertedRuleList.map((value, index) => {
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
                  Previewing {convertedRuleList.length <= 500 ? convertedRuleList.length : 500} of {total} events in
                  series
                </TableCell>
              </TableRow>
            </TableFooter>
          </Table>

          {/*<ScrollBar orientation="vertical" forceMount></ScrollBar>
      </ScrollArea>}
        </div>
      </div>
      <ScrollBar orientation="vertical" forceMount></ScrollBar>
    </ScrollArea>
  );*/
}

function NumberFormInput<TFieldValues extends FieldValues, TPath extends FieldPathByValue<TFieldValues, string>>({
  control,
  name,
  disabled = false,
}: {
  control: Control<TFieldValues>;
  name: TPath;
  disabled?: boolean;
}) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem className="space-y-3">
          <FormControl>
            <FormItem className="flex items-center gap-2">
              <FormControl>
                <InputNumber
                  type="number"
                  className="w-15 text-center"
                  max={999}
                  min={1}
                  value={field.value}
                  onChange={field.onChange}
                  placeholder="#"
                  disabled={disabled}
                ></InputNumber>
              </FormControl>
            </FormItem>
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

function PeriodFormSelection<TFieldValues extends FieldValues, TPath extends FieldPathByValue<TFieldValues, string>>({
  control,
  name,
  disabled,
}: {
  control: Control<TFieldValues>;
  name: TPath;
  disabled: boolean;
}) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <FormItem>
          <div className="flex flex-row gap-2">
            <FormControl>
              <Select
                name={field.name}
                value={field.value}
                defaultValue={field.value}
                key={field.value}
                onValueChange={field.onChange}
                disabled={disabled}
              >
                <SelectTrigger id={field.name} data-invalid={fieldState.invalid} className={"min-w-23"}>
                  <SelectValue placeholder="Select an option" />
                </SelectTrigger>

                <SelectContent className={"min-w-23"}>
                  {periods.map((period) => {
                    return (
                      <SelectItem key={period.id} value={period.id} className="flex-1">
                        {period.label}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </FormControl>
            <FormMessage />
          </div>
        </FormItem>
      )}
    />
  );
}

function WeekDayFormSelection<TFieldValues extends FieldValues, TPath extends FieldPathByValue<TFieldValues, string>>({
  control,
  name,
  disabled,
  hideDayWeekday = true,
}: {
  control: Control<TFieldValues>;
  name: TPath;
  disabled: boolean;
  hideDayWeekday?: boolean;
}) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <FormItem>
          <div className="flex flex-row gap-2">
            <FormControl>
              <Select
                name={field.name}
                value={field.value}
                defaultValue={field.value}
                key={field.value}
                onValueChange={field.onChange}
                disabled={disabled}
              >
                <SelectTrigger id={field.name} data-invalid={fieldState.invalid} className={"min-w-31"}>
                  <SelectValue placeholder="Select an option" />
                </SelectTrigger>

                <SelectContent className={"min-w-31"}>
                  {weekdayPatterns.map((period) => {
                    if (hideDayWeekday && (period.id === "day" || period.id === "weekday" || period.id === "weekend")) {
                      return;
                    }

                    return (
                      <SelectItem key={period.id} value={period.id} className="flex-1">
                        {period.label}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </FormControl>
            <FormMessage />
          </div>
        </FormItem>
      )}
    />
  );
}

function MonthFormSelection<TFieldValues extends FieldValues, TPath extends FieldPathByValue<TFieldValues, string>>({
  control,
  name,
  disabled,
}: {
  control: Control<TFieldValues>;
  name: TPath;
  disabled: boolean;
}) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <FormItem>
          <div className="flex flex-row gap-2">
            <FormControl>
              <Select
                name={field.name}
                value={field.value}
                defaultValue={field.value}
                key={field.value}
                onValueChange={field.onChange}
                disabled={disabled}
              >
                <SelectTrigger id={field.name} data-invalid={fieldState.invalid} className={"min-w-31"}>
                  <SelectValue placeholder="Select an option" />
                </SelectTrigger>

                <SelectContent className={"min-w-31"}>
                  {months.map((period) => {
                    return (
                      <SelectItem key={period.id} value={period.id} className="flex-1">
                        {period.label}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </FormControl>
            <FormMessage />
          </div>
        </FormItem>
      )}
    />
  );
}

function DailyForm({ form }: { form: UseFormReturn<IRecurrenceForm, IRecurrenceForm> }) {
  return (
    <FormField
      control={form.control}
      name="dailyPattern"
      render={({ field }) => (
        <FormItem className="space-y-3">
          <FormControl>
            <RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="flex flex-col ">
              <FormItem className="flex items-center gap-3 ">
                <FormControl className="mx-5.5">
                  <RadioGroupItem value="daily" />
                </FormControl>
                {
                  //###################################################
                  //EVERY X DAYS
                  //###################################################
                }
                <FormLabel className="">Every</FormLabel>
                <NumberFormInput
                  control={form.control}
                  name="dayValue"
                  disabled={field.value === "daily" ? false : true}
                ></NumberFormInput>
                <FormLabel>Days</FormLabel>
              </FormItem>
              <FormItem className="flex items-center gap-3">
                <FormControl className="mx-5.5">
                  <RadioGroupItem value="weekdays" />
                </FormControl>
                <FormLabel className="font-normal">Every Weekday (Mon, Tue, Wed, Thu, Fri)</FormLabel>
              </FormItem>
            </RadioGroup>
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

function WeeklyForm({ form }: { form: UseFormReturn<IRecurrenceForm, IRecurrenceForm> }) {
  return (
    <div className="grid gap-8">
      <div className="flex flex-row gap-2">
        <FormLabel className="min-w-15  justify-end">Every</FormLabel>
        <NumberFormInput control={form.control} name={"weekValue"} disabled={false} />
        <FormLabel>Weeks</FormLabel>
      </div>
      <FormField
        control={form.control}
        name="weekdays"
        render={() => (
          <FormItem>
            <FormLabel>Repeat on:</FormLabel>
            <Separator className=" max-w-60" />
            <div className="flex flex-col  flex-wrap flex-1 gap-2 max-h-30 max-w-60">
              {weekdays.map((weekday) => (
                <FormField
                  key={weekday.id}
                  control={form.control}
                  name="weekdays"
                  render={({ field }) => {
                    return (
                      <FormItem key={weekday.id} className="flex flex-row items-center gap-2">
                        <FormControl>
                          <Checkbox
                            checked={field.value?.includes(weekday.id)}
                            onCheckedChange={(checked) => {
                              return checked
                                ? field.onChange([...field.value, weekday.id])
                                : field.onChange(field.value?.filter((value) => value !== weekday.id));
                            }}
                          />
                        </FormControl>
                        <FormLabel className="text-sm font-normal">{weekday.label}</FormLabel>
                      </FormItem>
                    );
                  }}
                />
              ))}
            </div>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
}

function MonthlyForm({ form }: { form: UseFormReturn<IRecurrenceForm, IRecurrenceForm> }) {
  const [monthPeriodValue] = useWatch({
    control: form.control,
    name: ["monthPeriodValue"],
  });

  return (
    <FormField
      control={form.control}
      name="monthlyPattern"
      render={({ field }) => (
        <FormItem className="space-y-3">
          <FormControl>
            <RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="flex flex-col ">
              <FormItem className="flex items-center gap-3 ">
                <FormControl className="mx-5.5">
                  <RadioGroupItem value="dayInMonth" />
                </FormControl>
                {
                  //###################################################
                  //EVERY X DAY EVERY X MONTHS
                  //###################################################
                }
                <div className="flex flex-row gap-2">
                  <FormLabel className="">Day</FormLabel>
                  <NumberFormInput
                    control={form.control}
                    name="monthDayValue"
                    disabled={field.value === "dayInMonth" ? false : true}
                  ></NumberFormInput>
                  <FormLabel className="min-w-14 ">of every</FormLabel>
                  <NumberFormInput
                    control={form.control}
                    name="monthValue"
                    disabled={field.value === "dayInMonth" ? false : true}
                  ></NumberFormInput>
                  <FormLabel>month(s)</FormLabel>
                </div>
              </FormItem>
              <FormItem className="flex items-center gap-3">
                <FormControl className="mx-5.5">
                  <RadioGroupItem value="patternInMonth" />
                </FormControl>
                {
                  //###################################################
                  //ON THE X PERIOD X WEEKDAY OF EVERY X MONTH(S)
                  //###################################################
                }

                <div className="flex flex-row gap-2">
                  <FormLabel>On the</FormLabel>
                  <PeriodFormSelection
                    control={form.control}
                    name="monthPeriodValue"
                    disabled={field.value === "patternInMonth" ? false : true}
                  ></PeriodFormSelection>
                  <WeekDayFormSelection
                    control={form.control}
                    name="monthWeekdayValue"
                    disabled={field.value === "patternInMonth" ? false : true}
                    hideDayWeekday={monthPeriodValue === "1" || monthPeriodValue === "-1" ? false : true}
                  ></WeekDayFormSelection>
                  <FormLabel className="min-w-14 ">of every</FormLabel>
                  <NumberFormInput
                    control={form.control}
                    name="monthValue"
                    disabled={field.value === "patternInMonth" ? false : true}
                  ></NumberFormInput>
                  <FormLabel>month(s)</FormLabel>
                </div>
              </FormItem>
            </RadioGroup>
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

function YearlyForm({ form }: { form: UseFormReturn<IRecurrenceForm, IRecurrenceForm> }) {
  const [yearPeriodValue] = useWatch({
    control: form.control,
    name: ["yearPeriodValue"],
  });
  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-row gap-2">
        <FormLabel className="min-w-15  justify-end">Every</FormLabel>
        <NumberFormInput control={form.control} name={"yearValue"} disabled={false} />
        <FormLabel>Year(s)</FormLabel>
      </div>
      <FormField
        control={form.control}
        name="yearlyPattern"
        render={({ field }) => (
          <FormItem className="space-y-3">
            <FormControl>
              <RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="flex flex-col ">
                <FormItem className="flex items-center gap-3 ">
                  <FormControl className="mx-5.5">
                    <RadioGroupItem value="dayInMonthInYear" />
                  </FormControl>
                  {
                    //###################################################
                    //EVERY X DAY EVERY X MONTHS
                    //###################################################
                  }
                  <div className="flex flex-row gap-2">
                    <FormLabel className="">On</FormLabel>
                    <MonthFormSelection
                      control={form.control}
                      name="yearMonthValue"
                      disabled={field.value === "dayInMonthInYear" ? false : true}
                    ></MonthFormSelection>
                    <NumberFormInput
                      control={form.control}
                      name="yearDayValue"
                      disabled={field.value === "dayInMonthInYear" ? false : true}
                    ></NumberFormInput>
                  </div>
                </FormItem>
                <FormItem className="flex items-center gap-3">
                  <FormControl className="mx-5.5">
                    <RadioGroupItem value="patternInMonthInYear" />
                  </FormControl>
                  {
                    //###################################################
                    //ON THE X PERIOD X WEEKDAY OF EVERY X MONTH(S)
                    //###################################################
                  }

                  <div className="flex flex-row gap-2">
                    <FormLabel>On the</FormLabel>
                    <PeriodFormSelection
                      control={form.control}
                      name="yearPeriodValue"
                      disabled={field.value === "patternInMonthInYear" ? false : true}
                    ></PeriodFormSelection>
                    <WeekDayFormSelection
                      control={form.control}
                      name="yearWeekdayValue"
                      disabled={field.value === "patternInMonthInYear" ? false : true}
                      hideDayWeekday={yearPeriodValue === "1" || yearPeriodValue === "-1" ? false : true}
                    ></WeekDayFormSelection>
                    <FormLabel>of</FormLabel>
                    <MonthFormSelection
                      control={form.control}
                      name="yearMonthValue"
                      disabled={field.value === "patternInMonthInYear" ? false : true}
                    ></MonthFormSelection>
                  </div>
                </FormItem>
              </RadioGroup>
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
}

const durations = [
  {
    id: "forever",
    label: "Forever",
  },
  {
    id: "until",
    label: "End Date",
  },
  {
    id: "count",
    label: "Total Instances",
  },
];

const repeatingPeriods = [
  {
    id: "daily",
    label: "Daily",
  },
  {
    id: "weekly",
    label: "Weekly",
  },
  {
    id: "monthly",
    label: "Monthly",
  },
  {
    id: "yearly",
    label: "Yearly",
  },
];

const weekdays = [
  {
    id: "monday",
    label: "Monday",
  },
  {
    id: "tuesday",
    label: "Tuesday",
  },
  {
    id: "wednesday",
    label: "Wednesday",
  },
  {
    id: "thursday",
    label: "Thursday",
  },
  {
    id: "friday",
    label: "Friday",
  },
  {
    id: "saturday",
    label: "Saturday",
  },
  {
    id: "sunday",
    label: "Sunday",
  },
] as const;

const weekdayPatterns = [
  {
    id: "monday",
    label: "Monday",
  },
  {
    id: "tuesday",
    label: "Tuesday",
  },
  {
    id: "wednesday",
    label: "Wednesday",
  },
  {
    id: "thursday",
    label: "Thursday",
  },
  {
    id: "friday",
    label: "Friday",
  },
  {
    id: "saturday",
    label: "Saturday",
  },
  {
    id: "sunday",
    label: "Sunday",
  },
  {
    id: "day",
    label: "Day",
  },
  {
    id: "weekday",
    label: "Weekday",
  },
  {
    id: "weekend",
    label: "Weekend",
  },
] as const;

const months = [
  {
    id: "1",
    label: "January",
  },
  {
    id: "2",
    label: "February",
  },
  {
    id: "3",
    label: "March",
  },
  {
    id: "4",
    label: "April",
  },
  {
    id: "5",
    label: "May",
  },
  {
    id: "6",
    label: "June",
  },
  {
    id: "7",
    label: "July",
  },
  {
    id: "8",
    label: "August",
  },
  {
    id: "9",
    label: "September",
  },
  {
    id: "10",
    label: "October",
  },
  {
    id: "11",
    label: "November",
  },
  {
    id: "12",
    label: "December",
  },
] as const;

const periods = [
  {
    id: "1",
    label: "first",
  },
  {
    id: "2",
    label: "second",
  },
  {
    id: "3",
    label: "third",
  },
  {
    id: "4",
    label: "fourth",
  },
  {
    id: "-1",
    label: "last",
  },
] as const;
