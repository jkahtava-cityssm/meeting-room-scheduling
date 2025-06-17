"use client";

import { Form, FormField, FormLabel, FormItem, FormControl, FormMessage } from "@/components/ui/form";
import { Select, SelectItem, SelectContent, SelectTrigger, SelectValue } from "@/components/ui/select";

import { IRecurrence, SRecurrence } from "@/lib/schemas/calendar";
import { Control, FieldPathByValue, FieldValues, useForm, UseFormReturn } from "react-hook-form";
import { z } from "zod/v4";
import { zodResolver } from "@hookform/resolvers/zod";
import { RadioGroup, RadioGroupItem } from "../ui/radio-group";
import InputNumber from "../ui/input-number";
import { Checkbox } from "../ui/checkbox";
import { Separator } from "../ui/separator";

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
});

export function UpdateRecurrenceForm({ isLoading, recurrence }: { isLoading: boolean; recurrence?: IRecurrenceForm }) {
  const form = useForm<IRecurrenceForm>({
    resolver: zodResolver(SRecurrenceForm),
    reValidateMode: "onChange",
    mode: "all",
    defaultValues: {
      repeatingType: "",
      repeatingPattern: "",
      rule: "",
      startDate: recurrence ? recurrence.startDate : new Date(),
      endDate: recurrence ? recurrence.endDate : new Date(),
      weekdays: [],

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
    },
  });

  const type = form.watch("repeatingType");
  const pattern = form.watch("repeatingPattern");

  if (isLoading) {
    return <>...Loading</>;
  }

  return (
    <Form {...form}>
      <form id="event-form">
        <div className="flex flex-col md:flex-row gap-2">
          <div className="flex flex-col flex-1 gap-4 py-4">
            <FormLabel>Recurrence Pattern</FormLabel>
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
            {type === "daily" && (
              <div>
                <FormField
                  control={form.control}
                  name="dailyPattern"
                  render={({ field }) => (
                    <FormItem className="space-y-3">
                      <FormControl>
                        <RadioGroup
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          className="flex flex-col "
                        >
                          <FormItem className="flex items-center gap-3 ">
                            <FormControl className="mx-5.5">
                              <RadioGroupItem value="daily" />
                            </FormControl>
                            {
                              //###################################################
                              //EVERY X DAYS
                              //###################################################
                              <FormField
                                control={form.control}
                                name="dayValue"
                                render={({ field }) => (
                                  <FormItem className="space-y-3">
                                    <FormControl>
                                      <FormItem className="flex items-center gap-2">
                                        <FormLabel className="">Every</FormLabel>

                                        <FormItem className="flex items-center gap-3">
                                          <FormControl>
                                            <InputNumber
                                              type="number"
                                              className="w-15 text-center"
                                              max={999}
                                              min={1}
                                              value={field.value}
                                              onChange={field.onChange}
                                              placeholder="X"
                                            ></InputNumber>
                                          </FormControl>
                                          <FormLabel>Days</FormLabel>
                                        </FormItem>
                                      </FormItem>
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            }
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
              </div>
            )}
            {type === "weekly" && (
              <div className="grid gap-8">
                <FormField
                  control={form.control}
                  name="weeklyOptions"
                  render={({ field }) => (
                    <FormItem className="space-y-3">
                      <FormControl>
                        <FormItem className="flex items-center gap-2">
                          <FormLabel className="min-w-15  justify-end">Every</FormLabel>

                          <FormItem className="flex items-center gap-3">
                            <FormControl>
                              <InputNumber
                                type="number"
                                className="max-w-15 text-center"
                                max={999}
                                min={1}
                                placeholder="X"
                              ></InputNumber>
                            </FormControl>
                            <FormLabel>Weeks</FormLabel>
                          </FormItem>
                        </FormItem>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

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
            )}
            {type === "monthly" && <MonthlyForm form={form}></MonthlyForm>}

            {type === "yearly" && (
              <FormField
                control={form.control}
                name="repeatingPattern"
                render={({ field, fieldState }) => (
                  <FormItem>
                    <div className="flex flex-row gap-2">
                      <FormLabel id="typeLabel" htmlFor="repeatingPattern" className="min-w-15 justify-end">
                        Pattern
                      </FormLabel>
                      <FormControl>
                        <Select
                          name={field.name}
                          value={field.value}
                          defaultValue={field.value}
                          key={field.value}
                          onValueChange={field.onChange}
                        >
                          <SelectTrigger id={field.name} data-invalid={fieldState.invalid} className={"min-w-40"}>
                            <SelectValue placeholder="Select an option" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem key={"yearly"} value={"yearly"} className="flex-1">
                              Every X years on X month on X Day
                            </SelectItem>
                            <SelectItem key={"yearlyPattern"} value={"yearlyPattern"} className="flex-1">
                              Every X years on X period on X weekday of X Month
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </div>
                  </FormItem>
                )}
              />
            )}
          </div>
        </div>
      </form>
    </Form>
  );
}

function PeriodSelection<TFieldValues extends FieldValues, TPath extends FieldPathByValue<TFieldValues, string>>({
  control,
  name,
}: {
  control: Control<TFieldValues>;
  name: TPath;
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

function WeekDaySelection<TFieldValues extends FieldValues, TPath extends FieldPathByValue<TFieldValues, string>>({
  control,
  name,
}: {
  control: Control<TFieldValues>;
  name: TPath;
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
              >
                <SelectTrigger id={field.name} data-invalid={fieldState.invalid} className={"min-w-31"}>
                  <SelectValue placeholder="Select an option" />
                </SelectTrigger>

                <SelectContent className={"min-w-31"}>
                  {weekdays.map((period) => {
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

function MonthlyForm({ form }: { form: UseFormReturn<IRecurrenceForm, any, IRecurrenceForm> }) {
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
                  <div className="flex flex-row gap-2">
                    <FormField
                      control={form.control}
                      name="monthDayValue"
                      render={({ field }) => (
                        <FormItem className="space-y-3">
                          <FormControl>
                            <FormItem className="flex items-center gap-2">
                              <FormLabel className="">Day</FormLabel>

                              <FormItem className="flex items-center gap-2">
                                <FormControl>
                                  <InputNumber
                                    type="number"
                                    className="w-15 text-center"
                                    max={999}
                                    min={1}
                                    value={field.value}
                                    onChange={field.onChange}
                                    placeholder="X"
                                  ></InputNumber>
                                </FormControl>
                                <FormLabel className="min-w-14 ">of every</FormLabel>
                              </FormItem>
                            </FormItem>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="monthValue"
                      render={({ field }) => (
                        <FormItem className="space-y-3">
                          <FormControl>
                            <FormItem className="flex items-center gap-2">
                              <FormItem className="flex items-center gap-2">
                                <FormControl>
                                  <InputNumber
                                    type="number"
                                    className="w-15 text-center"
                                    max={999}
                                    min={1}
                                    value={field.value}
                                    onChange={field.onChange}
                                    placeholder="X"
                                  ></InputNumber>
                                </FormControl>
                                <FormLabel>month(s)</FormLabel>
                              </FormItem>
                            </FormItem>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                }
              </FormItem>
              <FormItem className="flex items-center gap-3">
                <FormControl className="mx-5.5">
                  <RadioGroupItem value="patternInMonth" />
                </FormControl>
                <FormLabel>On the</FormLabel>

                <FormField
                  control={form.control}
                  name="monthPeriodValue"
                  render={({ field, fieldState }) => (
                    <FormItem>
                      <div className="flex flex-row gap-2">
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
                <FormField
                  control={form.control}
                  name="monthWeekdayValue"
                  render={({ field, fieldState }) => (
                    <FormItem>
                      <div className="flex flex-row gap-2">
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
                            <SelectTrigger id={field.name} data-invalid={fieldState.invalid} className={"min-w-31"}>
                              <SelectValue placeholder="Select an option" />
                            </SelectTrigger>

                            <SelectContent className={"min-w-31"}>
                              {weekdays.map((period) => {
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
                <FormLabel className="min-w-14 ">of every</FormLabel>
                <FormField
                  control={form.control}
                  name="monthValue"
                  render={({ field }) => (
                    <FormItem className="space-y-3">
                      <FormControl>
                        <FormItem className="flex items-center gap-2">
                          <FormItem className="flex items-center gap-2">
                            <FormControl>
                              <InputNumber
                                type="number"
                                className="w-15 text-center"
                                max={999}
                                min={1}
                                value={field.value}
                                onChange={field.onChange}
                                placeholder="X"
                              ></InputNumber>
                            </FormControl>
                          </FormItem>
                        </FormItem>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormLabel>month(s)</FormLabel>
              </FormItem>
            </RadioGroup>
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

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

const months = [
  {
    id: "january",
    label: "January",
  },
  {
    id: "february",
    label: "February",
  },
  {
    id: "march",
    label: "March",
  },
  {
    id: "april",
    label: "April",
  },
  {
    id: "may",
    label: "May",
  },
  {
    id: "june",
    label: "June",
  },
  {
    id: "july",
    label: "July",
  },
  {
    id: "august",
    label: "August",
  },
  {
    id: "september",
    label: "September",
  },
  {
    id: "october",
    label: "October",
  },
  {
    id: "november",
    label: "November",
  },
  {
    id: "december",
    label: "December",
  },
] as const;

const periods = [
  {
    id: "first",
    label: "first",
  },
  {
    id: "second",
    label: "second",
  },
  {
    id: "third",
    label: "third",
  },
  {
    id: "fourth",
    label: "fourth",
  },
  {
    id: "last",
    label: "last",
  },
] as const;
