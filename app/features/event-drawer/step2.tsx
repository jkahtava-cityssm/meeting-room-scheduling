"use client";

import { FormField, FormLabel, FormItem, FormControl } from "@/components/ui/form";
import { Select, SelectItem, SelectContent, SelectTrigger, SelectValue } from "@/components/ui/select";

import { Control, FieldPathByValue, FieldValues, useFormContext, useWatch } from "react-hook-form";
import { z } from "zod/v4";

import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import InputNumber from "@/components/ui/input-number";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";

import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { useEffect, useRef, useState } from "react";
import { CalendarDayPopover } from "@/components/calendar-day-popover/calendar-day-popover";

import { step2Schema } from "./event-drawer.validator";
import { useMultiStepForm } from "./multi-step-form";
import { FormStatus, MultiStepFormContextProps } from "./types";
import { getRRuleData, RRuleFieldValues } from "./rrule-preview-helper";
import { RRulePreview } from "./rrule-preview";
import { endOfDay } from "date-fns";
import { Session } from "@/lib/auth-client";

/**
 * TO-DO: One Day add the ability to set a truly forever pattern, it will require
 * creating multiple sub recurrences of 100 year chunks so that thousands of years dont need to be generated
 * this will complicate updating and will likely require adjustments to the database.
 * it might only need a special parent key or we make the event have a 1 to many relationship.
 * @param param0
 * @returns
 */

export function Step2({ formStatus, session }: { formStatus: FormStatus; session: Session | null }) {
  //const [lastDate, setLastDate] = useState<Date>();

  const { startDate } = useMultiStepForm();

  const lastRuleRef = useRef<string | undefined>("");
  const lastDateRef = useRef<string | undefined>("");
  const prevValuesRef = useRef<RRuleFieldValues | undefined>(undefined);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  const [count, setCount] = useState<number | undefined>(0);
  const [localDates, setLocalDates] = useState<Date[] | undefined>([]);
  const [isCalculating, setCalculating] = useState<boolean>(true);

  const { control, getValues, setValue, watch, trigger } = useFormContext<z.infer<typeof step2Schema>>();

  //const [rruleData, setRRuleData] = useState(null);

  const fieldValues = useWatch({
    control: control,
    defaultValue: getValues(),
    name: [
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
    ],
  });

  useEffect(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    let isCancelled = false;
    setCalculating(true);

    debounceTimerRef.current = setTimeout(() => {
      const fetchData = async () => {
        try {
          const previousFieldValues = JSON.stringify(prevValuesRef.current);
          const currentFieldValues = JSON.stringify(fieldValues);

          const isSame = previousFieldValues ? previousFieldValues === currentFieldValues : false;
          if (isSame) return;
          prevValuesRef.current = fieldValues;

          const data = await getRRuleData({ startDate, fieldValues });

          if (isCancelled) return;

          if (data.ruleString && data.lastDate && data.firstDate) {
            setValue("rule", data.ruleString, {
              shouldDirty: true,
              shouldTouch: true,
              shouldValidate: false,
            });
            setValue("ruleStartDate", data.firstDate, {
              shouldDirty: true,
              shouldTouch: true,
              shouldValidate: false,
            });
            setValue("ruleEndDate", data.lastDate, {
              shouldDirty: true,
              shouldTouch: true,
              shouldValidate: false,
            });
            trigger(["rule", "ruleStartDate", "ruleEndDate"]);
          }

          setLocalDates(data.localDates ?? []);
          setCount(data.count ?? 0);
        } catch (err) {
          console.error("RRULE worker error:", err);
        } finally {
          if (!isCancelled) {
            setCalculating(false);
          }
        }
      };

      fetchData();
    }, 300);

    return () => {
      isCancelled = true;
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startDate, fieldValues]);

  const type = watch("repeatingType");
  const durationType = watch("durationType");
  const isReadOnly = formStatus === "Read" || formStatus === "Loading";

  //console.log(startDate);
  return (
    <>
      <ScrollArea type="always">
        <div className="h-[calc(40dvh)] w-full">
          <div className="flex flex-col gap-2">
            <div className="flex flex-col flex-1 gap-4 py-4 min-h-90">
              <div className="flex flex-row gap-2 w-100">
                <FormField
                  control={control}
                  name="durationType"
                  render={({ field, fieldState }) => (
                    <FormItem>
                      <div className="flex flex-row gap-2">
                        <FormLabel id="typeLabel" className="min-w-15 justify-end">
                          Duration
                        </FormLabel>

                        <Select
                          //{...field}
                          disabled={isReadOnly}
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
                          <FormControl>
                            <SelectTrigger id={field.name} data-invalid={fieldState.invalid} className={"min-w-40"}>
                              <SelectValue placeholder="Select an option" />
                            </SelectTrigger>
                          </FormControl>
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
                      </div>
                    </FormItem>
                  )}
                />
                {durationType === "count" && (
                  <NumberFormInput control={control} name="occurrences" disabled={isReadOnly}></NumberFormInput>
                )}
                {durationType === "until" && (
                  <FormField
                    control={control}
                    name="untilDate"
                    render={({ field, fieldState }) => (
                      <FormItem className="space-y-3">
                        <FormControl>
                          <FormItem className="flex items-center gap-2">
                            <FormControl>
                              <CalendarDayPopover
                                id="untilDate"
                                disabled={isReadOnly}
                                value={field.value ? endOfDay(new Date(field.value)) : new Date()}
                                onSelect={(date) => {
                                  field.onChange(date ? endOfDay(date).toISOString() : "");
                                }}
                                placeholder="Select a date"
                                data-invalid={fieldState.invalid}
                                className="w-52"
                              />
                            </FormControl>
                          </FormItem>
                        </FormControl>
                      </FormItem>
                    )}
                  />
                )}
              </div>
              <FormField
                control={control}
                name="repeatingType"
                render={({ field, fieldState }) => (
                  <FormItem>
                    <div className="flex flex-row gap-2">
                      <FormLabel id="typeLabel" className="min-w-15 justify-end">
                        Repeats
                      </FormLabel>

                      <Select
                        //{...field}
                        disabled={isReadOnly}
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
                        <FormControl>
                          <SelectTrigger id={field.name} data-invalid={fieldState.invalid} className={"min-w-40"}>
                            <SelectValue placeholder="Select an option" />
                          </SelectTrigger>
                        </FormControl>
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
                    </div>
                  </FormItem>
                )}
              />
              {type === "daily" && <DailyForm control={control} isReadOnly={isReadOnly}></DailyForm>}
              {type === "weekly" && <WeeklyForm control={control} isReadOnly={isReadOnly}></WeeklyForm>}
              {type === "monthly" && <MonthlyForm control={control} isReadOnly={isReadOnly}></MonthlyForm>}
              {type === "yearly" && <YearlyForm control={control} isReadOnly={isReadOnly}></YearlyForm>}
            </div>
          </div>
        </div>
        <RRulePreview localDates={localDates} totalRules={count} isLoading={isCalculating} />
        <ScrollBar orientation="vertical" forceMount></ScrollBar>
      </ScrollArea>
    </>
  );
}

function NumberFormInput<TFieldValues extends FieldValues, TPath extends FieldPathByValue<TFieldValues, string>>({
  control,
  name,
  disabled = false,
  showError = true,
}: {
  control: Control<TFieldValues>;
  name: TPath;
  disabled?: boolean;
  showError?: boolean;
}) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field, fieldState }) => (
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
                  data-invalid={fieldState.invalid && showError}
                  aria-invalid={fieldState.invalid && showError}
                ></InputNumber>
              </FormControl>
            </FormItem>
          </FormControl>
          {
            //
          }
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
            <Select
              name={field.name}
              value={field.value}
              key={field.value}
              onValueChange={field.onChange}
              disabled={disabled}
            >
              <FormControl>
                <SelectTrigger id={field.name} data-invalid={fieldState.invalid} className={"min-w-23"}>
                  <SelectValue placeholder="Select a period" />
                </SelectTrigger>
              </FormControl>
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
            <Select
              name={field.name}
              value={field.value}
              defaultValue={field.value}
              key={field.value}
              onValueChange={field.onChange}
              disabled={disabled}
            >
              <FormControl>
                <SelectTrigger id={field.name} data-invalid={fieldState.invalid} className={"min-w-31"}>
                  <SelectValue placeholder="Select a weekday" />
                </SelectTrigger>
              </FormControl>
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
  showError = true,
}: {
  control: Control<TFieldValues>;
  name: TPath;
  disabled: boolean;
  showError?: boolean;
}) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <FormItem>
          <div className="flex flex-row gap-2">
            <Select
              name={field.name}
              value={field.value}
              defaultValue={field.value}
              key={field.value}
              onValueChange={field.onChange}
              disabled={disabled}
            >
              <FormControl>
                <SelectTrigger
                  id={field.name}
                  data-invalid={fieldState.invalid && showError}
                  aria-invalid={fieldState.invalid && showError}
                  className={"min-w-31"}
                >
                  <SelectValue placeholder="Select a month" />
                </SelectTrigger>
              </FormControl>
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
          </div>
        </FormItem>
      )}
    />
  );
}

function DailyForm({ control, isReadOnly }: { control: Control<z.infer<typeof step2Schema>>; isReadOnly: boolean }) {
  return (
    <FormField
      control={control}
      name="dailyPattern"
      render={({ field }) => (
        <FormItem className="space-y-3">
          <FormControl>
            <RadioGroup
              onValueChange={field.onChange}
              defaultValue={field.value}
              className="flex flex-col "
              disabled={isReadOnly}
            >
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
                  control={control}
                  name="dayValue"
                  disabled={field.value === "daily" && !isReadOnly ? false : true}
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
        </FormItem>
      )}
    />
  );
}

function WeeklyForm({ control, isReadOnly }: { control: Control<z.infer<typeof step2Schema>>; isReadOnly: boolean }) {
  return (
    <div className="grid gap-8">
      <div className="flex flex-row gap-2">
        <FormLabel className="min-w-15  justify-end">Every</FormLabel>
        <NumberFormInput control={control} name={"weekValue"} disabled={isReadOnly} />
        <FormLabel>Weeks</FormLabel>
      </div>
      <FormField
        control={control}
        name="weekdays"
        render={() => (
          <FormItem>
            <FormLabel>Repeat on:</FormLabel>
            <Separator className=" max-w-60" />
            <div className="flex flex-col  flex-wrap flex-1 gap-2 max-h-30 max-w-60">
              {weekdays.map((weekday) => (
                <FormField
                  key={weekday.id}
                  control={control}
                  name="weekdays"
                  render={({ field }) => {
                    return (
                      <FormItem key={weekday.id} className="flex flex-row items-center gap-2">
                        <FormControl>
                          <Checkbox
                            disabled={isReadOnly}
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
          </FormItem>
        )}
      />
    </div>
  );
}

function MonthlyForm({ control, isReadOnly }: { control: Control<z.infer<typeof step2Schema>>; isReadOnly: boolean }) {
  const [monthPeriodValue] = useWatch({
    control: control,
    name: ["monthPeriodValue"],
  });

  return (
    <FormField
      control={control}
      name="monthlyPattern"
      render={({ field }) => (
        <FormItem className="space-y-3">
          <FormControl>
            <RadioGroup
              onValueChange={field.onChange}
              defaultValue={field.value}
              className="flex flex-col "
              disabled={isReadOnly}
            >
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
                    control={control}
                    name="monthDayValue"
                    disabled={field.value === "dayInMonth" && !isReadOnly ? false : true}
                  ></NumberFormInput>
                  <FormLabel className="min-w-14 ">of every</FormLabel>
                  <NumberFormInput
                    control={control}
                    name="monthValue"
                    disabled={field.value === "dayInMonth" && !isReadOnly ? false : true}
                    showError={field.value === "dayInMonth" ? true : false}
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
                    control={control}
                    name="monthPeriodValue"
                    disabled={field.value === "patternInMonth" && !isReadOnly ? false : true}
                  ></PeriodFormSelection>
                  <WeekDayFormSelection
                    control={control}
                    name="monthWeekdayValue"
                    disabled={field.value === "patternInMonth" && !isReadOnly ? false : true}
                    hideDayWeekday={monthPeriodValue === "1" || monthPeriodValue === "-1" ? false : true}
                  ></WeekDayFormSelection>
                  <FormLabel className="min-w-14 ">of every</FormLabel>
                  <NumberFormInput
                    control={control}
                    name="monthValue"
                    disabled={field.value === "patternInMonth" && !isReadOnly ? false : true}
                    showError={field.value === "patternInMonth" ? true : false}
                  ></NumberFormInput>
                  <FormLabel>month(s)</FormLabel>
                </div>
              </FormItem>
            </RadioGroup>
          </FormControl>
        </FormItem>
      )}
    />
  );
}

function YearlyForm({ control, isReadOnly }: { control: Control<z.infer<typeof step2Schema>>; isReadOnly: boolean }) {
  const [yearPeriodValue] = useWatch({
    control: control,
    name: ["yearPeriodValue"],
  });
  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-2">
        <div className="flex flex-row gap-2">
          <FormLabel className="min-w-15  justify-end">Every</FormLabel>
          <NumberFormInput control={control} name={"yearValue"} disabled={isReadOnly} />
          <FormLabel>Year(s)</FormLabel>
        </div>
      </div>
      <div className="flex flex-col gap-2">
        <div className="flex flex-row gap-2">
          <FormField
            control={control}
            name="yearlyPattern"
            render={({ field }) => (
              <FormItem className="space-y-3">
                <FormControl>
                  <RadioGroup
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    className="flex flex-col "
                    disabled={isReadOnly}
                  >
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
                          control={control}
                          name="yearMonthValue"
                          disabled={field.value === "dayInMonthInYear" && !isReadOnly ? false : true}
                          showError={field.value === "dayInMonthInYear" ? true : false}
                        ></MonthFormSelection>
                        <NumberFormInput
                          control={control}
                          name="yearDayValue"
                          disabled={field.value === "dayInMonthInYear" && !isReadOnly ? false : true}
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
                          control={control}
                          name="yearPeriodValue"
                          disabled={field.value === "patternInMonthInYear" && !isReadOnly ? false : true}
                        ></PeriodFormSelection>
                        <WeekDayFormSelection
                          control={control}
                          name="yearWeekdayValue"
                          disabled={field.value === "patternInMonthInYear" && !isReadOnly ? false : true}
                          hideDayWeekday={yearPeriodValue === "1" || yearPeriodValue === "-1" ? false : true}
                        ></WeekDayFormSelection>
                        <FormLabel>of</FormLabel>
                        <MonthFormSelection
                          control={control}
                          name="yearMonthValue"
                          disabled={field.value === "patternInMonthInYear" && !isReadOnly ? false : true}
                          showError={field.value === "patternInMonthInYear" ? true : false}
                        ></MonthFormSelection>
                      </div>
                    </FormItem>
                  </RadioGroup>
                </FormControl>
              </FormItem>
            )}
          />
        </div>

        <div className="flex flex-col gap-2">
          <ErrorMessage control={control} fieldName="ruleEndDate" />
          <ErrorMessage control={control} fieldName="yearValue" />
          <ErrorMessage control={control} fieldName="yearlyPattern" />
          <ErrorMessage control={control} fieldName="yearDayValue" />
          <ErrorMessage control={control} fieldName="yearPeriodValue" />
          <ErrorMessage control={control} fieldName="yearWeekdayValue" />
          <ErrorMessage control={control} fieldName="yearMonthValue" />
        </div>
      </div>
    </div>
  );
}

function ErrorMessage({
  control,
  fieldName,
}: {
  control: Control<z.infer<typeof step2Schema>>;
  fieldName: keyof z.infer<typeof step2Schema>;
}) {
  return (
    control.getFieldState(fieldName).error && (
      <span className="text-destructive text-sm">{control.getFieldState(fieldName).error?.message}</span>
    )
  );
}

const durations = [
  {
    id: "forever",
    label: "Max (200 Years)",
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
