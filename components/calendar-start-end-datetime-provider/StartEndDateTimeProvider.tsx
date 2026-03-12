"use client";

import React, { createContext, useContext, useMemo } from "react";
import { CalendarDayPopover } from "../calendar-day-popover/calendar-day-popover";
import { DateTimePicker } from "../calendar-datetime-picker/DateTimePicker";
import { Label } from "../ui/label";
import { TimeInterval } from "./useTimePicker";

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
};

function StartDatePicker({ invalid, isDisabled }: LeafProps) {
  const { startDate, endDate, setStart } = useStartEnd();
  return (
    <div className="flex flex-col gap-2">
      <Label id="start-date-label" data-error={invalid ? "data-invalid" : ""}>
        Start Date
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
        className="min-w-52"
        data-invalid={invalid ? "data-invalid" : ""}
        placeholder={""}
      />
    </div>
  );
}

function StartTimePicker({ invalid, isDisabled }: LeafProps) {
  const { startDate, endDate, minHour, maxHour, minuteInterval, setStart } = useStartEnd();
  return (
    <DateTimePicker
      id="start"
      currentDate={startDate}
      isInvalid={!!invalid}
      isDisabled={isDisabled}
      minHour={minHour}
      maxHour={maxHour}
      minuteInterval={minuteInterval}
      setDate={(next) => setStart(next)}
    />
  );
}

function EndDatePicker({ invalid, isDisabled }: LeafProps) {
  const { startDate, endDate, setEnd } = useStartEnd();
  return (
    <div className="flex flex-col gap-2">
      <Label id="end-date-label" data-error={invalid ? "data-invalid" : ""}>
        End Date
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
        disableDays={{ before: startDate }}
        className="min-w-52"
        data-invalid={invalid ? "data-invalid" : ""}
        placeholder={""}
      />
    </div>
  );
}

function EndTimePicker({ invalid, isDisabled }: LeafProps) {
  const { endDate, minHour, maxHour, minuteInterval, setEnd } = useStartEnd();
  return (
    <DateTimePicker
      id="end"
      currentDate={endDate}
      isInvalid={!!invalid}
      isDisabled={isDisabled}
      minHour={minHour}
      maxHour={maxHour}
      minuteInterval={minuteInterval}
      setDate={(next) => setEnd(next)}
    />
  );
}

/** Attach leaves for the compound API */
StartEndDateTimeProvider.StartDate = StartDatePicker;
StartEndDateTimeProvider.StartTime = StartTimePicker;
StartEndDateTimeProvider.EndDate = EndDatePicker;
StartEndDateTimeProvider.EndTime = EndTimePicker;
