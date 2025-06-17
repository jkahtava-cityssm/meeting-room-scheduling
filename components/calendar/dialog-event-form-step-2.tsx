"use client";

import { Form, FormField, FormLabel, FormItem, FormControl, FormMessage, FormDescription } from "@/components/ui/form";
import { Select, SelectItem, SelectContent, SelectTrigger, SelectValue } from "@/components/ui/select";

import { BookKey } from "lucide-react";
import { SingleDayPicker } from "@/components/ui/single-day-picker";
import { TimePicker } from "@/components/ui/time-picker";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";

import { IconColored } from "@/components/ui/icon-colored";

import { TColors } from "@/lib/types";

import { getDurationText } from "@/lib/helpers";
import { EditEventSkeleton } from "./skeleton-dialog-edit-event";
import { IRecurrence, SRecurrence } from "@/lib/schemas/calendar";
import { useForm } from "react-hook-form";
import { z } from "zod/v4";
import { zodResolver } from "@hookform/resolvers/zod";
import { Switch } from "../ui/switch";
import { RadioGroup, RadioGroupItem } from "../ui/radio-group";
import InputNumber from "../ui/input-number";
import { Checkbox } from "../ui/checkbox";
import { Separator } from "../ui/separator";

export interface IRecurrenceForm extends Pick<IRecurrence, "rule" | "startDate" | "endDate"> {
  repeatingType: string;
  repeatingPattern: string;
  dailyOptions: string;
  weeklyOptions: string;
  frequency: string;
  duration: string;
  weekdays: string[];
  monthDay: string;
  month: string;
}

const SRecurrenceForm = z.object({
  ...SRecurrence.pick({ rule: true, startDate: true, endDate: true }).shape,
  repeatingType: z.string(),
  repeatingPattern: z.string(),
  dailyOptions: z.string(),
  weeklyOptions: z.string(),
  frequency: z.string(),
  duration: z.string(),
  weekdays: z.array(z.string()).refine((value) => value.some((item) => item), {
    message: "You have to select at least one item.",
  }),
  monthDay: z.string(),
  month: z.string(),
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
                          <SelectItem key={"daily"} value={"daily"} className="flex-1">
                            Daily
                          </SelectItem>
                          <SelectItem key={"weekly"} value={"weekly"} className="flex-1">
                            Weekly
                          </SelectItem>
                          <SelectItem key={"monthly"} value={"monthly"} className="flex-1">
                            Monthly
                          </SelectItem>
                          <SelectItem key={"yearly"} value={"yearly"} className="flex-1">
                            Yearly
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </div>
                </FormItem>
              )}
            />
            {type === "daily" && (
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

                          <SelectContent className={"min-w-40"}>
                            <SelectItem key={"daily"} value={"daily"} className="flex-1">
                              Every X days
                            </SelectItem>
                            <SelectItem key={"weekday"} value={"weekday"} className="flex-1">
                              Every weekday
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

            {type === "monthly" && (
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

                          <SelectContent className={"min-w-40"}>
                            <SelectItem key={"monthly"} value={"monthly"} className="flex-1">
                              Every X months on X Day
                            </SelectItem>
                            <SelectItem key={"monthlyPattern"} value={"monthlyPattern"} className="flex-1">
                              Every X months on X period on X weekday
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

            {type === "daily" && (
              <div>
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
                                className="max-w-20 text-center"
                                max={999}
                                min={1}
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
                                className="max-w-20 text-center"
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
            {type === "monthly" && (
              <div className="grid gap-4">
                <FormField
                  control={form.control}
                  name="weeklyOptions"
                  render={({ field }) => (
                    <FormItem className="space-y-3">
                      <FormControl>
                        <FormItem className="flex items-center gap-2">
                          <FormLabel className="min-w-15 justify-end">Every</FormLabel>

                          <FormItem className="flex items-center gap-3">
                            <FormControl>
                              <InputNumber
                                type="number"
                                className="max-w-20 text-center"
                                max={999}
                                min={1}
                                placeholder="X"
                              ></InputNumber>
                            </FormControl>
                            <FormLabel>Months</FormLabel>
                          </FormItem>
                        </FormItem>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="weeklyOptions"
                  render={({ field }) => (
                    <FormItem className="space-y-3">
                      <FormControl>
                        <FormItem className="flex items-center gap-2">
                          <FormLabel className="min-w-15 justify-end">Every</FormLabel>

                          <FormItem className="flex items-center gap-3">
                            <FormControl>
                              <InputNumber
                                type="number"
                                className="max-w-20 text-center"
                                max={999}
                                min={1}
                                placeholder="X"
                              ></InputNumber>
                            </FormControl>
                            <FormLabel>Day</FormLabel>
                          </FormItem>
                        </FormItem>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}
            {type === "yearly" && (
              <div>
                <FormField
                  control={form.control}
                  name="weeklyOptions"
                  render={({ field }) => (
                    <FormItem className="space-y-3">
                      <FormControl>
                        <FormItem className="flex items-center gap-2">
                          <FormLabel className="min-w-15 justify-end">Every</FormLabel>

                          <FormItem className="flex items-center gap-3">
                            <FormControl>
                              <InputNumber
                                type="number"
                                className="max-w-20 text-center"
                                max={999}
                                min={1}
                                placeholder="X"
                              ></InputNumber>
                            </FormControl>
                            <FormLabel>Years</FormLabel>
                          </FormItem>
                        </FormItem>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}
          </div>
        </div>
      </form>
    </Form>
  );
}

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
