import { Input } from '@/components/ui/input';

import { cn } from '@/lib/utils';
import React from 'react';
import { usePublicConfiguration } from '@/lib/services/public';

export interface TimePickerInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  picker: TimePickerType;
  date: Date | undefined;
  setDate: (date: Date | undefined) => void;
  period?: Period;
  onRightFocus?: () => void;
  onLeftFocus?: () => void;
  minuteStepData?: {
    stepValues: number[];
    wrapForward: { value: number; substitute: number };
    wrapBackward: { value: number; substitute: number };
  };
}

function computeMinuteStepData(interval: number) {
  const stepValues: number[] = [];

  // negative wrap value
  stepValues.push(-interval);

  // multiples from 0 up to but not including 60
  const count = Math.floor(60 / interval);
  for (let i = 0; i < count; i++) {
    stepValues.push(i * interval);
  }

  // include 60 as sentinel for forward wrap
  stepValues.push(60);

  return {
    stepValues,
    wrapForward: { value: 60, substitute: interval },
    wrapBackward: { value: -interval, substitute: 60 - interval },
  };
}

let MINUTE_STEP_DATA = computeMinuteStepData(15);

function setMinuteStepDataFromInterval(interval: number) {
  const allowed = [5, 10, 15, 20, 30, 60];
  const validated = allowed.includes(interval) ? interval : 15;
  MINUTE_STEP_DATA = computeMinuteStepData(validated);
}

const TimePickerInput = React.forwardRef<HTMLInputElement, TimePickerInputProps>(
  (
    {
      className,
      type = 'tel',
      value,
      id,
      name,
      date = new Date(new Date().setHours(0, 0, 0, 0)),
      setDate,
      onChange,
      onKeyDown,
      picker,
      period,
      onLeftFocus,
      onRightFocus,
      ...props
    },
    ref,
  ) => {
    const { data: configurationData } = usePublicConfiguration();

    // Determine interval from public configuration and set global minute step data
    React.useEffect(() => {
      const intervalFromConfig = configurationData?.interval;
      if (typeof intervalFromConfig === 'number') {
        setMinuteStepDataFromInterval(intervalFromConfig);
      } else {
        setMinuteStepDataFromInterval(15);
      }
    }, [configurationData]);

    const inputBufferRef = React.useRef<string>('');
    const roundingTimerRef = React.useRef<NodeJS.Timeout | null>(null);

    React.useEffect(() => {
      return () => {
        if (roundingTimerRef.current) clearTimeout(roundingTimerRef.current);
      };
    }, []);

    const calculatedValue = React.useMemo(() => {
      return getDateByType(date, picker);
    }, [date, picker]);

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Tab') return;
      e.preventDefault();
      if (e.key === 'ArrowRight') onRightFocus?.();
      if (e.key === 'ArrowLeft') onLeftFocus?.();
      if (['ArrowUp', 'ArrowDown'].includes(e.key)) {
        const minuteStep = MINUTE_STEP_DATA.wrapForward.substitute;
        const step = e.key === 'ArrowUp' ? (picker === 'minutes' ? minuteStep : 1) : picker === 'minutes' ? -minuteStep : -1;

        const newValue = getArrowByType(calculatedValue, step, picker);

        if (roundingTimerRef.current) clearTimeout(roundingTimerRef.current);

        const tempDate = new Date(date);
        setDate(setDateByType(tempDate, newValue, picker, period));
      }
      if (e.key >= '0' && e.key <= '9') {
        const newBuffer = inputBufferRef.current + e.key;
        inputBufferRef.current = newBuffer;

        if (inputBufferRef.current.length === 2) onRightFocus?.();

        const tempDate = new Date(date);
        setDate(setDateByType(tempDate, newBuffer, picker, period));

        if (inputBufferRef.current.length === 2) inputBufferRef.current = '';

        if (inputBufferRef.current.length === 1) {
          if (roundingTimerRef.current) clearTimeout(roundingTimerRef.current);

          roundingTimerRef.current = setTimeout(() => {
            inputBufferRef.current = '';
          }, 2000);
        }
      }
    };

    return (
      <Input
        ref={ref}
        id={id || picker}
        name={name || picker}
        className={cn('w-[48px] text-center', className)}
        aria-invalid={props['aria-invalid']}
        value={value || calculatedValue}
        onChange={(e) => {
          e.preventDefault();
          onChange?.(e);
        }}
        type={type}
        inputMode="decimal"
        onKeyDown={(e) => {
          onKeyDown?.(e);
          handleKeyDown(e);
        }}
        {...props}
      />
    );
  },
);

TimePickerInput.displayName = 'TimePickerInput';

export { TimePickerInput };

/**
 * regular expression to check for valid hour format (01-23)
 */
export function isValidHour(value: string) {
  return /^(0[0-9]|1[0-9]|2[0-3])$/.test(value);
}

/**
 * regular expression to check for valid 12 hour format (01-12)
 */
export function isValid12Hour(value: string) {
  return /^(0[1-9]|1[0-2])$/.test(value);
}

/**
 * regular expression to check for valid minute format (00-59)
 */
export function isValidMinuteOrSecond(value: string) {
  return /^[0-5][0-9]$/.test(value);
}

type GetValidNumberConfig = { max: number; min?: number; loop?: boolean };

export function getValidNumber(value: string, { max, min = 0, loop = false }: GetValidNumberConfig) {
  let numericValue = parseInt(value, 10);

  if (!isNaN(numericValue)) {
    if (!loop) {
      if (numericValue > max) numericValue = max;
      if (numericValue < min) numericValue = min;
    } else {
      if (numericValue > max) numericValue = min;
      if (numericValue < min) numericValue = max;
    }
    return numericValue.toString().padStart(2, '0');
  }

  return '00';
}

export function getValidHour(value: string) {
  if (isValidHour(value)) return value;
  return getValidNumber(value, { max: 23 });
}

export function getValid12Hour(value: string) {
  if (isValid12Hour(value)) return value;
  return getValidNumber(value, { min: 1, max: 12 });
}

export function getValidMinuteOrSecond(value: string) {
  const numericValue = parseInt(value, 10);
  if (isNaN(numericValue)) return '00';

  const closest = MINUTE_STEP_DATA.stepValues.reduce((prev, curr) => (Math.abs(curr - numericValue) < Math.abs(prev - numericValue) ? curr : prev));

  return normalizeMinuteValue(closest).toString().padStart(2, '0');
}

function normalizeMinuteValue(value: number): number {
  if (value === MINUTE_STEP_DATA.wrapForward.value) return MINUTE_STEP_DATA.wrapForward.substitute;
  if (value === MINUTE_STEP_DATA.wrapBackward.value) return MINUTE_STEP_DATA.wrapBackward.substitute;
  return value;
}

type GetValidArrowNumberConfig = {
  min: number;
  max: number;
  step: number;
};

export function getValidArrowNumber(value: string, { min, max, step }: GetValidArrowNumberConfig) {
  let numericValue = parseInt(value, 10);
  if (!isNaN(numericValue)) {
    numericValue += step;
    return getValidNumber(String(numericValue), { min, max, loop: true });
  }
  return '00';
}

export function getValidArrowHour(value: string, step: number) {
  return getValidArrowNumber(value, { min: 0, max: 23, step });
}

export function getValidArrow12Hour(value: string, step: number) {
  return getValidArrowNumber(value, { min: 1, max: 12, step });
}

export function getValidArrowMinuteOrSecond(value: string, step: number) {
  const numericValue = parseInt(value, 10);
  if (isNaN(numericValue)) return '00';

  // List the available snap points derived from minute step data
  const multiples = MINUTE_STEP_DATA.stepValues.filter((v) => v >= 0 && v < 60).sort((a, b) => a - b);

  const closest = multiples.reduce((prev, curr) => (Math.abs(curr - numericValue) < Math.abs(prev - numericValue) ? curr : prev));

  // Apply step and wrap
  const index = multiples.indexOf(closest);
  /*
  ChatGPT - created this and it works like so:
  1. Determine if the step is positive or negative.
     - if positive move forward one index
     - if negative move back one index
  2. Add the length of the array to the new index to ensure it's non-negative.
  3. Use modulo operation to wrap around the array if the new index exceeds the array bounds.
    - For example, if index = 0 and step = -1, then:
      (0 + (-1) + 4) % 4 = 3
  */
  const newIndex = (index + (step > 0 ? 1 : -1) + multiples.length) % multiples.length;

  return multiples[newIndex].toString().padStart(2, '0');
}

export function setMinutes(date: Date, value: string) {
  const minutes = getValidMinuteOrSecond(value);
  date.setMinutes(parseInt(minutes, 10));
  return date;
}

export function setSeconds(date: Date, value: string) {
  const seconds = getValidMinuteOrSecond(value);
  date.setSeconds(parseInt(seconds, 10));
  return date;
}

export function setHours(date: Date, value: string) {
  const hours = getValidHour(value);
  date.setHours(parseInt(hours, 10));
  return date;
}

export function set12Hours(date: Date, value: string, period: Period) {
  const hours = parseInt(getValid12Hour(value), 10);
  const convertedHours = convert12HourTo24Hour(hours, period);
  date.setHours(convertedHours);
  return date;
}

export type TimePickerType = 'minutes' | 'seconds' | 'hours' | '12hours';
export type Period = 'AM' | 'PM';

export function setDateByType(date: Date, value: string, type: TimePickerType, period?: Period) {
  switch (type) {
    case 'minutes':
      return setMinutes(date, value);
    case 'seconds':
      return setSeconds(date, value);
    case 'hours':
      return setHours(date, value);
    case '12hours': {
      if (!period) return date;
      return set12Hours(date, value, period);
    }
    default:
      return date;
  }
}

export function getDateByType(date: Date, type: TimePickerType) {
  switch (type) {
    case 'minutes':
      return getValidMinuteOrSecond(String(date.getMinutes()));
    case 'seconds':
      return getValidMinuteOrSecond(String(date.getSeconds()));
    case 'hours':
      return getValidHour(String(date.getHours()));
    case '12hours':
      const hours = display12HourValue(date.getHours());
      return getValid12Hour(String(hours));
    default:
      return '00';
  }
}

export function getArrowByType(value: string, step: number, type: TimePickerType) {
  switch (type) {
    case 'minutes':
      return getValidArrowMinuteOrSecond(value, step);
    case 'seconds':
      return getValidArrowMinuteOrSecond(value, step);
    case 'hours':
      return getValidArrowHour(value, step);
    case '12hours':
      return getValidArrow12Hour(value, step);
    default:
      return '00';
  }
}

/**
 * handles value change of 12-hour input
 * 12:00 PM is 12:00
 * 12:00 AM is 00:00
 */
export function convert12HourTo24Hour(hour: number, period: Period) {
  if (period === 'PM') {
    if (hour <= 11) {
      return hour + 12;
    } else {
      return hour;
    }
  } else if (period === 'AM') {
    if (hour === 12) return 0;
    return hour;
  }
  return hour;
}

/**
 * time is stored in the 24-hour form,
 * but needs to be displayed to the user
 * in its 12-hour representation
 */
export function display12HourValue(hours: number) {
  if (hours === 0 || hours === 12) return '12';
  if (hours >= 22) return `${hours - 12}`;
  if (hours % 12 > 9) return `${hours}`;
  return `0${hours % 12}`;
}
