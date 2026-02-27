"use client";

import { useFormContext, useWatch } from "react-hook-form";
import { z } from "zod/v4";
import { endOfDay } from "date-fns";

import { FormField, FormLabel, FormItem, FormControl } from "@/components/ui/form";
import { Select, SelectItem, SelectContent, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";

import { CalendarDayPopover } from "@/components/calendar-day-popover/calendar-day-popover";
import { Session } from "@/lib/auth-client";
import { useMultiStepForm } from "../event-drawer/multi-step-form";
import { useRRulePreview } from "./use-rrule-preview";
import { step2Schema } from "../event-drawer/event-drawer.validator";
import { FormStatus } from "../event-drawer/types";
import { NumberFormInput } from "./components/number-form-input";
import { DailyForm } from "./sub-forms/rrule-day-form";
import { RRulePreview } from "../event-drawer/rrule-preview";
import { MonthlyForm } from "./sub-forms/rrule-monthly-form";
import { WeeklyForm } from "./sub-forms/rrule-weekly-form";
import { YearlyForm } from "./sub-forms/rrule-yearly-form";

// Import your newly created sub-forms and hooks

export function Step2({ formStatus }: { formStatus: FormStatus; session: Session | null }) {
  const { startDate } = useMultiStepForm();
  const { control, watch } = useFormContext<z.infer<typeof step2Schema>>();

  // All calculation logic, debouncing, and state is now hidden in this hook
  const { localDates, count, isCalculating } = useRRulePreview(startDate);

  const type = watch("repeatingType");
  const durationType = watch("durationType");
  const isReadOnly = formStatus === "Read" || formStatus === "Loading";

  return (
    <ScrollArea type="always">
      <div className="h-[calc(40dvh)] w-full">
        <div className="flex flex-col gap-2">
          <div className="flex flex-col flex-1 gap-4 py-4 min-h-90">
            {/* DURATION SECTION */}
            <div className="flex flex-row gap-2 w-100">
              <FormField
                control={control}
                name="durationType"
                render={({ field, fieldState }) => (
                  <FormItem>
                    <div className="flex flex-row gap-2">
                      <FormLabel className="min-w-15 justify-end">Duration</FormLabel>
                      <Select
                        disabled={isReadOnly}
                        value={field.value}
                        onValueChange={field.onChange}
                        key={field.value}
                      >
                        <FormControl>
                          <SelectTrigger data-invalid={fieldState.invalid} className="min-w-40">
                            <SelectValue placeholder="Select an option" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {durations.map((d) => (
                            <SelectItem key={d.id} value={d.id}>
                              {d.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </FormItem>
                )}
              />

              {durationType === "count" && (
                <NumberFormInput control={control} name="occurrences" disabled={isReadOnly} />
              )}

              {durationType === "until" && (
                <FormField
                  control={control}
                  name="untilDate"
                  render={({ field, fieldState }) => (
                    <CalendarDayPopover
                      id="untilDate"
                      disabled={isReadOnly}
                      value={field.value ? endOfDay(new Date(field.value)) : new Date()}
                      onSelect={(date) => field.onChange(date ? endOfDay(date).toISOString() : "")}
                      placeholder="Select a date"
                      data-invalid={fieldState.invalid}
                      className="w-52"
                    />
                  )}
                />
              )}
            </div>

            {/* REPEATING TYPE SELECT */}
            <FormField
              control={control}
              name="repeatingType"
              render={({ field, fieldState }) => (
                <FormItem>
                  <div className="flex flex-row gap-2">
                    <FormLabel className="min-w-15 justify-end">Repeats</FormLabel>
                    <Select disabled={isReadOnly} value={field.value} onValueChange={field.onChange} key={field.value}>
                      <FormControl>
                        <SelectTrigger data-invalid={fieldState.invalid} className="min-w-40">
                          <SelectValue placeholder="Select an option" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {repeatingPeriods.map((p) => (
                          <SelectItem key={p.id} value={p.id}>
                            {p.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </FormItem>
              )}
            />

            {/* DYNAMIC RECURRENCE FORMS */}
            <div className="pt-4">
              {type === "daily" && <DailyForm control={control} isReadOnly={isReadOnly} />}
              {type === "weekly" && <WeeklyForm control={control} isReadOnly={isReadOnly} />}
              {type === "monthly" && <MonthlyForm control={control} isReadOnly={isReadOnly} />}
              {type === "yearly" && <YearlyForm control={control} isReadOnly={isReadOnly} />}
            </div>
          </div>
        </div>
      </div>

      {/* CALCULATION PREVIEW */}
      <RRulePreview localDates={localDates} totalRules={count} isLoading={isCalculating} />
      <ScrollBar orientation="vertical" forceMount />
    </ScrollArea>
  );
}

const durations = [
  { id: "forever", label: "Max (200 Years)" },
  { id: "until", label: "End Date" },
  { id: "count", label: "Total Instances" },
];

const repeatingPeriods = [
  { id: "daily", label: "Daily" },
  { id: "weekly", label: "Weekly" },
  { id: "monthly", label: "Monthly" },
  { id: "yearly", label: "Yearly" },
];
