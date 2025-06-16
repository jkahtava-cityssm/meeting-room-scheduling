"use client";

import * as React from "react";

import { Period, TimePickerInput } from "./time-picker-input";
import { Label } from "./label";
import { TimePeriodSelect } from "./time-period-select";

function TimePicker({ ...props }: Omit<React.ComponentProps<typeof TimePickerInput>, "picker">) {
  const [period, setPeriod] = React.useState<Period>(getPeriodFromDate(props.date));

  const minuteRef = React.useRef<HTMLInputElement>(null);
  const hourRef = React.useRef<HTMLInputElement>(null);
  const periodRef = React.useRef<HTMLButtonElement>(null);
  return (
    <div className="flex gap-2 ">
      <div className="grid gap-2 justify-items-center">
        <Label
          id={props.id + "HourLabel"}
          data-error={props["aria-invalid"]}
          htmlFor={props.id + "HourInput"}
          //className="text-center"
        >
          Hours
        </Label>
        <TimePickerInput
          id={props.id + "HourInput"}
          aria-invalid={props["aria-invalid"]}
          picker="12hours"
          period={period}
          date={props.date}
          setDate={props.setDate}
          ref={hourRef}
          onRightFocus={() => minuteRef.current?.focus()}
        />
      </div>
      <div className="grid gap-2 justify-items-center">
        <Label id={props.id + "MinuteLabel"} data-error={props["aria-invalid"]} htmlFor={props.id + "MinuteInput"}>
          Minutes
        </Label>
        <TimePickerInput
          id={props.id + "MinuteInput"}
          aria-invalid={props["aria-invalid"]}
          picker="minutes"
          date={props.date}
          setDate={props.setDate}
          ref={minuteRef}
          onLeftFocus={() => hourRef.current?.focus()}
          onRightFocus={() => periodRef.current?.focus()}
        />
      </div>
      <div className="grid gap-2 justify-items-center">
        <Label id={props.id + "PeriodLabel"} data-error={props["aria-invalid"]} htmlFor={props.id + "PeriodSelect"}>
          Period
        </Label>
        <TimePeriodSelect
          id={props.id + "PeriodSelect"}
          aria-invalid={props["aria-invalid"]}
          period={period}
          setPeriod={setPeriod}
          date={props.date}
          setDate={props.setDate}
          ref={periodRef}
          onLeftFocus={() => minuteRef.current?.focus()}
        />
      </div>
    </div>
  );
}

/**
 * time is stored in the 24-hour form,
 * but needs to be displayed to the user
 * in its 12-hour representation
 */
export function getPeriodFromDate(date?: Date) {
  if (!date) {
    return "AM";
  }

  if (date.getHours() >= 12) {
    return "PM";
  }

  return "AM";
}

export { TimePicker };
