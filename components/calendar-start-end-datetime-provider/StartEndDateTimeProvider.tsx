"use client";

import React, { createContext, useContext, useMemo } from "react";
import { CalendarDayPopover } from "../calendar-day-popover/calendar-day-popover";
import { TimePicker } from "../calendar-time-picker/TimePicker";
import { Label } from "../ui/label";
import { TimeInterval } from "../calendar-time-picker/useTimePicker";
import { cn } from "@/lib/utils";
import { Button, buttonVariants } from "../ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip";
import { LucideLock } from "lucide-react";

type Ctx = {
  startDate: Date;
  endDate: Date;
  minHour: number;
  maxHour: number;
  minuteInterval: TimeInterval;
  preserveDuration: boolean;
  clampEndToStart: boolean;
  // Updaters expose the shared logic
  setStart: (next: Date) => void;
  setEnd: (next: Date) => void;
};

const StartEndCtx = createContext<Ctx | null>(null);
const useStartEnd = () => {
  const ctx = useContext(StartEndCtx);
  if (!ctx) throw new Error("Must be used within <StartEndDateTimeProvider/>");
  return ctx;
};

// Utility: apply the time from oldDate onto newDate (keeps hours/minutes)
const mergeTime = (newDate: Date, oldDate: Date) => {
  const merged = new Date(newDate);
  merged.setHours(oldDate.getHours(), oldDate.getMinutes(), 0, 0);
  return merged;
};

type RootProps = {
  startDate: Date;
  endDate: Date;
  onChange: (start: Date, end: Date) => void;
  minHour: number;
  maxHour: number;
  minuteInterval: TimeInterval;
  /** Keep the end time offset equal to the original duration when start changes */
  preserveDuration?: boolean;
  /** Prevent end from going earlier than start */
  clampEndToStart?: boolean;
  isDisabled?: boolean;
  children: React.ReactNode;
};

/**
 * Logic-only provider for shared behavior across the 4 pickers.
 * No extra DOM wrapper—so you can place the two FormField blocks anywhere beneath it.
 */
export function StartEndDateTimeProvider({
  startDate,
  endDate,
  onChange,
  minHour,
  maxHour,
  minuteInterval,
  preserveDuration = false,
  clampEndToStart = false,
  isDisabled = false,
  children,
}: RootProps) {
  const value = useMemo<Ctx>(() => {
    const setStart = (next: Date) => {
      const newStart = next;
      let newEnd = endDate;

      if (preserveDuration) {
        const duration = endDate.getTime() - startDate.getTime();
        newEnd = new Date(newStart.getTime() + Math.max(0, duration));
      }

      if (clampEndToStart && newEnd.getTime() < newStart.getTime()) {
        newEnd = newStart;
      }

      onChange(newStart, newEnd);
    };

    const setEnd = (next: Date) => {
      let newEnd = next;
      if (clampEndToStart && newEnd.getTime() < startDate.getTime()) {
        newEnd = startDate;
      }
      onChange(startDate, newEnd);
    };

    return {
      startDate,
      endDate,
      minHour,
      maxHour,
      minuteInterval,
      preserveDuration,
      clampEndToStart,
      setStart,
      setEnd,
    };
  }, [startDate, endDate, onChange, minHour, maxHour, minuteInterval, preserveDuration, clampEndToStart]);

  return <StartEndCtx.Provider value={value}>{children}</StartEndCtx.Provider>;
}

type LeafProps = {
  invalid?: boolean;
  isDisabled?: boolean;
  className?: string;
  label?: string;
  maxFutureDate?: Date;
};

function StartDatePicker({ invalid, isDisabled, className, label = "Start Date", maxFutureDate }: LeafProps) {
  const { startDate, endDate, setStart } = useStartEnd();
  return (
    <div className="flex flex-col gap-2">
      <Label
        id="start-date-label"
        data-error={invalid ? "data-invalid" : ""}
        className={cn(invalid && "text-destructive ")}
      >
        {label}
      </Label>
      <CalendarDayPopover
        id={`StartDatePicker`}
        aria-labelledby="start-date-label"
        disabled={isDisabled}
        value={startDate}
        onSelect={(selectedDate) => {
          if (selectedDate) {
            setStart(mergeTime(selectedDate, startDate));
          }
        }}
        disableDays={{ before: new Date(), after: maxFutureDate }}
        className={cn("min-w-52", className)}
        data-invalid={invalid ? "data-invalid" : ""}
        placeholder={""}
      />
    </div>
  );
}

function StartTimePicker({ invalid, isDisabled, className }: LeafProps) {
  const { startDate, endDate, minHour, maxHour, minuteInterval, setStart } = useStartEnd();
  return (
    <TimePicker
      id="start"
      currentDate={startDate}
      isInvalid={!!invalid}
      isDisabled={isDisabled}
      minHour={minHour}
      maxHour={maxHour}
      minuteInterval={minuteInterval}
      setDate={(next) => setStart(next)}
      className={cn(className)}
    />
  );
}

function EndDatePicker({ invalid, isDisabled, className, label = "End Date", maxFutureDate }: LeafProps) {
  const { startDate, endDate, setEnd } = useStartEnd();

  return (
    <div className="flex flex-col gap-2">
      <Label
        id="end-date-label"
        data-error={invalid ? "data-invalid" : ""}
        className={cn(invalid && "text-destructive ")}
      >
        {label}
      </Label>
      <CalendarDayPopover
        id={`EndDatePicker`}
        aria-labelledby="end-date-label"
        disabled={isDisabled}
        value={endDate}
        onSelect={(selectedDate) => {
          if (selectedDate) {
            setEnd(mergeTime(selectedDate, endDate));
          }
        }}
        disableDays={{ before: startDate, after: maxFutureDate }}
        className={cn("min-w-52", className)}
        data-invalid={invalid ? "data-invalid" : ""}
        placeholder={""}
      />
    </div>
  );
}

function EndTimePicker({ invalid, isDisabled, className }: LeafProps) {
  const { endDate, minHour, maxHour, minuteInterval, setEnd } = useStartEnd();
  return (
    <TimePicker
      id="end"
      currentDate={endDate}
      isInvalid={!!invalid}
      isDisabled={isDisabled}
      minHour={minHour}
      maxHour={maxHour}
      minuteInterval={minuteInterval}
      setDate={(next) => setEnd(next)}
      className={cn(className)}
    />
  );
}

function NoDataPlaceholder({
  invalid,
  isDisabled,
  className,
  label = "Label Name",
  message = "No Data",
  date,
}: LeafProps & { message: string; date: string }) {
  return (
    <div className="flex flex-col gap-2">
      <Label
        id="no-data-label"
        data-error={invalid ? "data-invalid" : ""}
        className={cn(invalid && "text-destructive ")}
      >
        {label}
      </Label>
      <Tooltip delayDuration={500}>
        <TooltipTrigger asChild>
          <div
            id={`NoDataPlaceholder`}
            className={cn(
              buttonVariants({ variant: "outline" }),
              "bg-accent/50 hover:bg-accent/50",
              "group relative h-9 w-full justify-start whitespace-nowrap px-3 py-2 font-normal  disabled:opacity-75 justify-between",
              className,
            )}
          >
            {date}
            <LucideLock className="stroke-muted-foreground" />
          </div>
        </TooltipTrigger>
        <TooltipContent>{message}</TooltipContent>
      </Tooltip>
    </div>
  );
}

/** Attach leaves for the compound API */
StartEndDateTimeProvider.StartDate = StartDatePicker;
StartEndDateTimeProvider.StartTime = StartTimePicker;
StartEndDateTimeProvider.EndDate = EndDatePicker;
StartEndDateTimeProvider.EndTime = EndTimePicker;

StartEndDateTimeProvider.NoDataPlaceholder = NoDataPlaceholder;
