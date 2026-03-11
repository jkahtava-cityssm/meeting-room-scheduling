"use client";

import { TimeInterval, useTimePicker } from "./useTimePicker";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Tabs, TabsList, TabsTrigger } from "../ui/tabs";
import { useState } from "react";
import { DateTimePicker } from "./DateTimePicker";
import { intervalToDuration } from "date-fns";
import { CalendarDayPopover } from "../calendar-day-popover/calendar-day-popover";
import { start } from "repl";

export function StartEndDateTimePicker({
  currentStartDate,
  currentEndDate,
  onDatesChange,
  isInvalid,
  minHour,
  maxHour,
  minuteInterval,
}: {
  currentStartDate: Date;
  currentEndDate: Date;
  onDatesChange: (start: Date, end: Date) => void;
  isInvalid: boolean;
  minHour: number;
  maxHour: number;
  minuteInterval: TimeInterval;
}) {
  const [startDate, setStartDate] = useState(currentStartDate);
  const [endDate, setEndDate] = useState(currentEndDate);

  const mergeTime = (newDate: Date, oldDate: Date) => {
    const merged = new Date(newDate);
    merged.setHours(oldDate.getHours(), oldDate.getMinutes(), 0, 0);
    return merged;
  };

  const syncDates = (s: Date, e: Date) => {
    setStartDate(s);
    setEndDate(e);
    onDatesChange(s, e);
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-row gap-2">
        <div className="flex flex-col  gap-2 justify-items-start">
          <Label id={"StartDateLabel"} data-error={isInvalid ? "data-invalid" : ""} htmlFor={"StartDatePicker"}>
            StartDate
          </Label>
          <CalendarDayPopover
            id={`StartDatePicker`}
            disabled={false}
            value={startDate}
            onSelect={(selectedDate) => {
              if (selectedDate) {
                const newStart = mergeTime(selectedDate, startDate);
                const durationMs = endDate.getTime() - startDate.getTime();
                const newEnd = new Date(newStart.getTime() + durationMs);
                syncDates(newStart, newEnd);
              }
            }}
            className="min-w-52"
            data-invalid={isInvalid ? "data-invalid" : ""}
            placeholder={""}
          />
        </div>
        <DateTimePicker
          currentDate={startDate}
          isInvalid={isInvalid}
          minHour={minHour}
          maxHour={maxHour}
          minuteInterval={minuteInterval}
          setDate={(startTime) => {
            syncDates(startTime, endDate);
          }}
        ></DateTimePicker>
      </div>
      <div className="flex flex-row gap-2">
        <div className="flex flex-col gap-2 justify-items-start">
          <Label
            id={"EndDateLabel"}
            data-error={isInvalid ? "data-invalid" : ""}
            htmlFor={"EndDatePicker"}
            //className="text-center"
          >
            End Date
          </Label>
          <CalendarDayPopover
            id={`EndDatePicker`}
            disabled={false}
            value={endDate}
            onSelect={(selectedDate) => {
              if (selectedDate) {
                syncDates(startDate, mergeTime(selectedDate, endDate));
              }
            }}
            disableDays={{ before: startDate }}
            className="min-w-52"
            data-invalid={isInvalid ? "data-invalid" : ""}
            placeholder={""}
          />
        </div>
        <DateTimePicker
          currentDate={endDate}
          isInvalid={isInvalid}
          minHour={minHour}
          maxHour={maxHour}
          minuteInterval={minuteInterval}
          setDate={(endTime) => {
            syncDates(startDate, endTime);
          }}
        ></DateTimePicker>
      </div>
    </div>
  );
}
