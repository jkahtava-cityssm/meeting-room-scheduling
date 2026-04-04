import { forwardRef, useEffect, useImperativeHandle, useState } from 'react';
import { CalendarDayPopover } from '../calendar-day-popover/calendar-day-popover';
import { TimePicker } from './time-picker';
import { Label } from './label';

type CombinedDateTimePickerProps = {
  id: string;
  disabled?: boolean;
  value?: string; // ISO string
  onChange: (value: string) => void;
  placeholder: string;
  className?: string;
  'data-invalid'?: boolean;
  label?: string;
  errorMessage: string | undefined;
  hideDate?: boolean;
  hideTime?: boolean;
};

export type DateTimePickerRef = {
  calculateNewTime: (isoString: string) => string;
  calculateNewDate: (isoString: string) => string;
  updateTime: (isoString: string) => void;
  updateDate: (isoString: string) => void;
};

function isISO8601(isoString: string): boolean {
  const isoRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2}(\.\d{3})?)?(Z|[+-]\d{2}:\d{2})?$/;
  return isoRegex.test(isoString) && !isNaN(Date.parse(isoString));
}

export const DateTimePicker = forwardRef<DateTimePickerRef, CombinedDateTimePickerProps>(
  ({ id, disabled, value, onChange, placeholder, label = '', errorMessage = '', hideDate, hideTime, ...props }, ref) => {
    const initialDate = value ? new Date(value) : new Date();
    const [date, setDate] = useState<Date>(initialDate);
    const message = errorMessage ? errorMessage : label;

    useEffect(() => {
      if (value) {
        setDate(new Date(value));
      }
    }, [value]);

    const updateDateTime = (isoString: string) => {
      const newDate = new Date(isoString);
      newDate.setSeconds(0);
      newDate.setMilliseconds(0);

      setDate(newDate);
      onChange(newDate.toISOString());
    };

    const calculateNewTime = (isoString: string) => {
      if (!isISO8601(isoString)) {
        console.warn('Invalid ISO 8601 time string:', isoString);
        return new Date().toISOString();
      }
      const newTime = new Date(isoString);

      const updated = new Date(date);
      updated.setHours(newTime.getHours(), newTime.getMinutes(), 0, 0);

      return updated.toISOString();
    };
    const calculateNewDate = (isoString: string) => {
      if (!isISO8601(isoString)) {
        console.warn('Invalid ISO 8601 date string:', isoString);
        return new Date().toISOString();
      }
      const newDate = new Date(isoString);

      const updated = new Date(date);
      updated.setFullYear(newDate.getFullYear());
      updated.setMonth(newDate.getMonth());
      updated.setDate(newDate.getDate());

      return updated.toISOString();
    };

    useImperativeHandle(ref, () => ({
      calculateNewTime,
      calculateNewDate,

      updateTime: (isoString: string) => {
        const newDateString = calculateNewTime(isoString);
        updateDateTime(newDateString);

        return newDateString;
      },
      updateDate: (isoString: string) => {
        const newDateString = calculateNewDate(isoString);

        updateDateTime(newDateString);

        return newDateString;
      },
    }));

    return (
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-1">
          <div className="grid col-span-1 gap-2">
            {!(hideDate ?? false) && (
              <Label
                id={id + 'DayPickerLabel'}
                data-error={props['data-invalid']}
                htmlFor={id + 'DayPickerLabel'}
                //className="text-center"
              >
                {message ? message : '\u00A0'}
              </Label>
            )}
            {!(hideDate ?? false) && (
              <CalendarDayPopover
                id={`${id}Date`}
                disabled={disabled}
                value={date}
                onSelect={(selectedDate) => {
                  if (!selectedDate) return;
                  const newDateString = calculateNewDate(selectedDate.toISOString());
                  updateDateTime(newDateString);
                }}
                placeholder={placeholder}
                className="min-w-52"
                data-invalid={props['data-invalid']}
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
              setDate={(selectedDate) => {
                if (selectedDate) {
                  const newDateString = calculateNewTime(selectedDate.toISOString());
                  updateDateTime(newDateString);
                }
              }}
              data-invalid={props['data-invalid']}
            />
          )}
        </div>
      </div>
    );
  },
);

DateTimePicker.displayName = 'DateTimePicker';
