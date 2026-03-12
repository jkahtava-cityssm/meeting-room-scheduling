"use client";

import { TimeInterval, useTimePicker } from "./useTimePicker";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Tabs, TabsList, TabsTrigger } from "../ui/tabs";
import * as React from "react";

type Period = "AM" | "PM";

export function DateTimePicker({
  id,
  currentDate,
  isInvalid,
  minHour,
  maxHour,
  minuteInterval,
  setDate,
  is24HourTime = false,
}: {
  id: string;
  currentDate: Date;
  isInvalid: boolean;
  minHour: number; // e.g., 1
  maxHour: number; // e.g., 12
  minuteInterval: TimeInterval; // e.g., 5
  setDate: (date: Date) => void;
  is24HourTime?: boolean;
}) {
  const {
    display,
    incrementHours,
    decrementHours,
    incrementMinutes,
    decrementMinutes,
    togglePeriod,
    handleManualInput,
    handleBlur,
    handleBackspace,
  } = useTimePicker({
    date: currentDate,
    setDate,
    minuteInterval,
    minHour,
    maxHour,
    is24HourTime,
  });

  const groupId = `${id}-starttime-group`;
  const groupLabelId = `${id}-starttime-label`;
  const hourInputId = `${id}-hour-input`;
  const hourLabelId = `${id}-hour-label`;
  const minuteInputId = `${id}-minute-input`;
  const minuteLabelId = `${id}-minute-label`;
  const periodLabelId = `${id}-period-label`;
  const errorId = `${id}-error`;
  const hintId = `${id}-hint`;

  const hours24 = currentDate.getHours();
  const hourNowForAria = is24HourTime ? hours24 : hours24 % 12 || 12;
  const minuteNow = currentDate.getMinutes();

  const hourMinForAria = is24HourTime ? Math.max(0, Math.min(23, minHour)) : 1;
  const hourMaxForAria = is24HourTime ? Math.max(0, Math.min(23, maxHour)) : 12;

  return (
    <div role="group" aria-labelledby={groupLabelId} className="flex flex-row gap-4" id={groupId}>
      <span id={groupLabelId} className="sr-only">
        Time selection
      </span>

      <span id={hintId} className="sr-only">
        Use the up and down arrow keys to adjust values. Press Tab to move to the next field.
      </span>

      <div className="flex flex-col gap-2 items-center">
        <Label id={hourLabelId} htmlFor={hourInputId} className="self-center">
          {is24HourTime ? "Hours (24h)" : "Hours"}
        </Label>
        <Input
          id={hourInputId}
          name="hour"
          className="w-14 text-center font-mono"
          value={display.hour}
          inputMode="numeric"
          pattern="[0-9]*"
          aria-invalid={isInvalid || undefined}
          aria-labelledby={hourLabelId}
          aria-describedby={`${hintId}${isInvalid ? ` ${errorId}` : ""}`}
          role="spinbutton"
          aria-valuemin={hourMinForAria}
          aria-valuemax={hourMaxForAria}
          aria-valuenow={hourNowForAria}
          aria-valuetext={
            is24HourTime
              ? `${hourNowForAria} ${hourNowForAria === 1 ? "hour" : "hours"}`
              : `${hourNowForAria} ${hourNowForAria === 1 ? "hour" : "hours"} ${display.period}`
          }
          onKeyDown={(e) => {
            switch (e.key) {
              case "ArrowUp":
                e.preventDefault();
                incrementHours();
                break;
              case "ArrowDown":
                e.preventDefault();
                decrementHours();
                break;
              case "Backspace":
                e.preventDefault();
                handleBackspace("hour");
                break;
              default:
                break;
            }
          }}
          onChange={(e) => {
            handleManualInput("hour", e.target.value);
          }}
          //onBlur={(e) => handleBlur("hour", e.target.value)}
        />
      </div>

      <div className="flex flex-col gap-2 items-center">
        <Label id={minuteLabelId} htmlFor={minuteInputId} className="self-center">
          Minutes
        </Label>
        <Input
          id={minuteInputId}
          name="minute"
          className="w-14 text-center font-mono"
          value={display.minutes}
          inputMode="numeric"
          pattern="[0-9]*"
          aria-invalid={isInvalid || undefined}
          aria-labelledby={minuteLabelId}
          aria-describedby={`${hintId}${isInvalid ? ` ${errorId}` : ""}`}
          role="spinbutton"
          aria-valuemin={0}
          aria-valuemax={59}
          aria-valuenow={minuteNow}
          aria-valuetext={`${minuteNow} minutes`}
          onKeyDown={(e) => {
            switch (e.key) {
              case "ArrowUp":
                e.preventDefault();
                incrementMinutes();
                break;
              case "ArrowDown":
                e.preventDefault();
                decrementMinutes();
                break;
              case "Backspace":
                e.preventDefault();
                handleBackspace("minute");
                break;
              default:
                break;
            }
          }}
          onChange={(e) => {
            handleManualInput("minute", e.target.value);
          }}
          //onBlur={(e) => handleBlur("minute", e.target.value)}
        />
      </div>

      {!is24HourTime && (
        <div className="flex flex-col gap-2 items-center">
          <Label id={periodLabelId} className="self-center">
            Period
          </Label>
          <Tabs
            value={display.period}
            onValueChange={(value) => togglePeriod(value as Period)}
            aria-labelledby={periodLabelId}
          >
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="AM">AM</TabsTrigger>
              <TabsTrigger value="PM">PM</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      )}

      {isInvalid && (
        <div id={errorId} role="alert" aria-live="polite" className="sr-only">
          The time you entered is invalid. Please check the hours and minutes.
        </div>
      )}
    </div>
  );
}
