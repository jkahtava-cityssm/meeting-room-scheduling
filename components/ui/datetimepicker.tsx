import { useEffect, useState } from "react";
import { SingleDayPicker } from "./single-day-picker";
import { TimePicker } from "./time-picker";
import { Label } from "./label";

type CombinedDateTimePickerProps = {
  id: string;
  disabled?: boolean;
  value?: string; // ISO string
  onChange: (value: string, changeType?: "date" | "time" | "both") => void;
  placeholder: string;
  className?: string;
  "data-invalid"?: boolean;
  label?: string;
};

export function DateTimePicker({
  id,
  disabled,
  value,
  onChange,
  placeholder,
  label = "",
  ...props
}: CombinedDateTimePickerProps) {
  const initialDate = value ? new Date(value) : new Date();
  const [day, setDay] = useState<Date>(initialDate);
  const [time, setTime] = useState<Date>(initialDate);

  // Sync external value
  useEffect(() => {
    if (value) {
      const newDate = new Date(value);
      setDay(newDate);
      setTime(newDate);
    }
  }, [value]);

  const updateCombinedDate = (newDay: Date, newTime: Date, changeType: "date" | "time" | "both") => {
    const combined = new Date(newDay);
    combined.setHours(newTime.getHours());
    combined.setMinutes(newTime.getMinutes());
    combined.setSeconds(0);
    combined.setMilliseconds(0);
    onChange(combined.toISOString(), changeType);
  };

  return (
    <div className="grid grid-cols-2 gap-4">
      <div className="col-span-1">
        <div className="grid col-span-1 gap-2">
          <Label id={id + "DayPickerLabel"} data-error={props["data-invalid"]} htmlFor={id + "DayPickerLabel"}>
            {label ? label : "\u00A0"}
          </Label>
          <SingleDayPicker
            id={`${id}Date`}
            disabled={disabled}
            value={day}
            onSelect={(selectedDate) => {
              if (!selectedDate) return;
              const updatedDay = new Date(day);
              updatedDay.setFullYear(selectedDate.getFullYear());
              updatedDay.setMonth(selectedDate.getMonth());
              updatedDay.setDate(selectedDate.getDate());
              setDay(updatedDay);
              updateCombinedDate(updatedDay, time, "date");
            }}
            placeholder={placeholder}
            className="min-w-52"
            data-invalid={props["data-invalid"]}
          />
        </div>
      </div>
      <div className="col-span-1">
        <TimePicker
          id={`${id}Time`}
          disabled={disabled}
          date={time}
          setDate={(updatedTime) => {
            if (!updatedTime) return;
            setTime(updatedTime);
            updateCombinedDate(day, updatedTime, "time");
          }}
          data-invalid={props["data-invalid"]}
        />
      </div>
    </div>
  );
}
