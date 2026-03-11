"use client";

import { TimeInterval, useTimePicker } from "./useTimePicker";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Tabs, TabsList, TabsTrigger } from "../ui/tabs";
import { useState } from "react";

export function DateTimePicker({
  currentDate,
  isInvalid,
  minHour,
  maxHour,
  minuteInterval,
  setDate,
}: {
  currentDate: Date;
  isInvalid: boolean;
  minHour: number;
  maxHour: number;
  minuteInterval: TimeInterval;
  setDate: (date: Date) => void;
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
  });

  return (
    <div className="flex flex-col gap-2">
      <div className="grid grid-cols-3 ">
        <div className="grid col-span-1 gap-2 justify-items-center">
          <Label
            id={`StartHourLabel`}
            data-error={isInvalid && "aria-invalid"}
            htmlFor={"StartHourInput"}
            //className="text-center"
          >
            Hours
          </Label>
          <Input
            id={`StartHourInput`}
            className="w-12 text-center font-mono"
            value={display.hour}
            onKeyDown={(e) => {
              if (e.key === "ArrowUp") {
                e.preventDefault();
                incrementHours();
              }
              if (e.key === "ArrowDown") {
                e.preventDefault();
                decrementHours();
              }
              if (e.key === "BackSpace") {
                e.preventDefault();
                handleBackspace("hour");
              }
            }}
            onChange={(e) => {
              handleManualInput("hour", e.target.value);
            }}
            onBlur={(e) => handleBlur("hour", e.target.value)}
          />
        </div>
        <div className="grid col-span-1 gap-2 justify-items-center">
          <Label id={"StartMinuteLabel"} data-error={isInvalid && "aria-invalid"} htmlFor={"StartMinuteInput"}>
            Minutes
          </Label>
          <Input
            id={`StartMinuteInput`}
            className="w-12 text-center font-mono"
            value={display.minutes}
            onKeyDown={(e) => {
              if (e.key === "ArrowUp") {
                e.preventDefault();
                incrementMinutes();
              }
              if (e.key === "ArrowDown") {
                e.preventDefault();
                decrementMinutes();
              }
              if (e.key === "BackSpace") {
                e.preventDefault();
                handleBackspace("minute");
              }
            }}
            onChange={(e) => {
              handleManualInput("minute", e.target.value);
            }}
            onBlur={(e) => handleBlur("minute", e.target.value)}
          />
        </div>
        <div className="grid col-span-1 gap-2 justify-items-center">
          <Label id={"PeriodLabel"} data-error={isInvalid && "aria-invalid"} htmlFor={"PeriodSelect"}>
            Period
          </Label>
          <Tabs value={display.period}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="AM" onClick={() => togglePeriod("AM")}>
                AM
              </TabsTrigger>
              <TabsTrigger value="PM" onClick={() => togglePeriod("PM")}>
                PM
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
/**.
 * 
  <div className="rounded-lg bg-slate-900 p-4 text-slate-400 font-mono text-[10px] space-y-1">
        <div className="grid grid-cols-2 gap-2">
          <span>Mins: {display.minutes}</span>
          <span>Hour: {display.hour}</span>
          <span>Period: {display.period}</span>
        </div>
        <div className="pt-2 border-t border-slate-800 truncate">ISO: {date.toISOString()}</div>
        <div className="pt-2 border-t border-slate-800 truncate">Local: {date.toLocaleString()}</div>
      </div>
 * 
 */
