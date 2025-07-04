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

import { ScrollArea, ScrollBar } from "../ui/scroll-area";
import { useEventForm } from "@/contexts/EventFormProvider";
import { useEffect } from "react";
import { SingleDayPicker } from "../ui/single-day-picker";
import { RRulePreview } from "./dialog-event-form-step-2-rrule-preview";

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

  const type = form.watch("repeatingType");
  const durationType = form.watch("durationType");

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

        <RRulePreview startDate={startDate} form={form} />
      </form>
    </Form>
  );
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
