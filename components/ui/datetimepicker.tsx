import { useState } from "react";
import { SingleDayPicker } from "./single-day-picker";
import { TimePicker } from "./time-picker";
import { Label } from "./label";

type CombinedDateTimePickerProps = {
  id: string;
  disabled?: boolean;
  value?: string; // ISO string
  onChange: (value: string) => void;
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
  const [date, setDate] = useState<Date>(initialDate);

  const updateDate = (newDate: Date) => {
    newDate.setSeconds(0);
    newDate.setMilliseconds(0);

    setDate(newDate);
    onChange(newDate.toISOString());
  };

  return (
    <div className="grid grid-cols-2 gap-4">
      <div className="col-span-1">
        <div className="grid col-span-1 gap-2">
          <Label
            id={id + "DayPickerLabel"}
            data-error={props["data-invalid"]}
            htmlFor={id + "DayPickerLabel"}
            //className="text-center"
          >
            {label ? label : "\u00A0"}
          </Label>
          <SingleDayPicker
            id={`${id}Date`}
            disabled={disabled}
            value={date}
            onSelect={(selectedDate) => {
              if (!selectedDate) return;
              const updated = new Date(date);
              updated.setFullYear(selectedDate.getFullYear());
              updated.setMonth(selectedDate.getMonth());
              updated.setDate(selectedDate.getDate());
              updateDate(updated);
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
          date={date}
          setDate={(updatedDate) => {
            if (updatedDate) updateDate(updatedDate);
          }}
          data-invalid={props["data-invalid"]}
        />
      </div>
    </div>
  );
}
