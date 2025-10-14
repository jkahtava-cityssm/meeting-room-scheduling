import { forwardRef, useEffect, useImperativeHandle, useState } from "react";
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
  hideDate?: boolean;
  hideTime?: boolean;
};

export type DateTimePickerRef = {
  updateTime: (isoString: string) => void;
  updateDate: (isoString: string) => void;
};

function isISO8601(isoString: string): boolean {
  const isoRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2}(\.\d{3})?)?(Z|[+-]\d{2}:\d{2})?$/;
  return isoRegex.test(isoString) && !isNaN(Date.parse(isoString));
}

export const DateTimePicker = forwardRef<DateTimePickerRef, CombinedDateTimePickerProps>(
  ({ id, disabled, value, onChange, placeholder, label = "", hideDate, hideTime, ...props }, ref) => {
    const initialDate = value ? new Date(value) : new Date();
    const [date, setDate] = useState<Date>(initialDate);

    useEffect(() => {
      if (value) {
        setDate(new Date(value));
      }
    }, [value]);

    const updateDateTime = (newDate: Date) => {
      newDate.setSeconds(0);
      newDate.setMilliseconds(0);

      setDate(newDate);
      onChange(newDate.toISOString());
    };

    useImperativeHandle(ref, () => ({
      updateTime: (isoString: string) => {
        if (!isISO8601(isoString)) {
          console.warn("Invalid ISO 8601 time string:", isoString);
          return;
        }
        const newTime = new Date(isoString);

        const updated = new Date(date);
        updated.setHours(newTime.getHours(), newTime.getMinutes(), 0, 0);
        updateDateTime(updated);
      },
      updateDate: (isoString: string) => {
        if (!isISO8601(isoString)) {
          console.warn("Invalid ISO 8601 date string:", isoString);
          return;
        }
        const newDate = new Date(isoString);

        const updated = new Date(date);
        updated.setFullYear(newDate.getFullYear());
        updated.setMonth(newDate.getMonth());
        updated.setDate(newDate.getDate());
        updateDateTime(updated);
      },
    }));

    return (
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-1">
          <div className="grid col-span-1 gap-2">
            {!(hideDate ?? false) && (
              <Label
                id={id + "DayPickerLabel"}
                data-error={props["data-invalid"]}
                htmlFor={id + "DayPickerLabel"}
                //className="text-center"
              >
                {label ? label : "\u00A0"}
              </Label>
            )}
            {!(hideDate ?? false) && (
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
                  updateDateTime(updated);
                }}
                placeholder={placeholder}
                className="min-w-52"
                data-invalid={props["data-invalid"]}
              />
            )}
          </div>
        </div>
        <div className="col-span-1">
          {!(hideTime ?? false) && (
            <TimePicker
              id={`${id}Time`}
              disabled={disabled}
              date={date}
              setDate={(updatedDate) => {
                if (updatedDate) updateDateTime(updatedDate);
              }}
              data-invalid={props["data-invalid"]}
            />
          )}
        </div>
      </div>
    );
  }
);

DateTimePicker.displayName = "DateTimePicker";
