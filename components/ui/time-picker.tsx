"use client";

import * as React from "react";
import * as SwitchPrimitive from "@radix-ui/react-switch";

import { cn } from "@/lib/utils";
import { Period, TimePickerInput } from "./time-picker-input";
import { Label } from "./label";
import { TimePeriodSelect } from "./time-period-select";

function TimePicker({ className, ...props }: Omit<React.ComponentProps<typeof TimePickerInput>, "picker">) {
  const [period, setPeriod] = React.useState<Period>("PM");
  return (
    <div className="flex gap-2  text-center">
      <div className="grid gap-2">
        <Label htmlFor="hours" className="text-center">
          Hours
        </Label>
        <TimePickerInput setDate={props.setDate} picker="hours" date={props.date} />
      </div>
      <div className="grid gap-2 text-center">
        <Label htmlFor="minutes">Minutes</Label>
        <TimePickerInput setDate={props.setDate} picker="minutes" date={props.date} />
      </div>
      <div className="grid gap-2 text-center">
        <Label htmlFor="period">Period</Label>
        <TimePeriodSelect period={period} setPeriod={setPeriod} date={props.date} setDate={props.setDate} />
      </div>
    </div>
  );
}

export { TimePicker };
