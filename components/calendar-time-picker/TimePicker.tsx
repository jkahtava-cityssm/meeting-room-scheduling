'use client';

import { TimeInterval, useTimePicker } from './useTimePicker';
import { Input } from '../ui/input';
import { Label } from '../ui/label';

import * as React from 'react';
import { cn } from '@/lib/utils';

type Period = 'AM' | 'PM';

export function TimePicker({
  id,
  currentDate,
  isInvalid,
  minHour,
  maxHour,
  minuteInterval,
  setDate,
  is24HourTime = false,
  isDisabled = false,
  className,
}: {
  id: string;
  currentDate: Date;
  isInvalid: boolean;
  minHour: number; // e.g., 1
  maxHour: number; // e.g., 12
  minuteInterval: TimeInterval; // e.g., 5
  setDate: (date: Date) => void;
  is24HourTime?: boolean;
  isDisabled?: boolean;
  className?: string;
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
    <div role="group" aria-labelledby={groupLabelId} className="flex flex-row gap-2" id={groupId}>
      <span id={groupLabelId} className="sr-only">
        Time selection
      </span>

      <span id={hintId} className="sr-only">
        Use the up and down arrow keys to adjust values. Press Tab to move to the next field.
      </span>

      <div className="flex flex-col gap-2 items-center">
        <Label id={hourLabelId} htmlFor={hourInputId} className="self-center">
          {is24HourTime ? 'Hours (24h)' : 'Hours'}
        </Label>
        <Input
          id={hourInputId}
          name="hour"
          className={cn('w-14 text-center font-mono', className)}
          value={display.hour}
          inputMode="numeric"
          pattern="[0-9]*"
          aria-invalid={isInvalid || undefined}
          aria-labelledby={hourLabelId}
          aria-describedby={`${hintId}${isInvalid ? ` ${errorId}` : ''}`}
          role="spinbutton"
          aria-valuemin={hourMinForAria}
          aria-valuemax={hourMaxForAria}
          aria-valuenow={hourNowForAria}
          aria-valuetext={
            is24HourTime
              ? `${hourNowForAria} ${hourNowForAria === 1 ? 'hour' : 'hours'}`
              : `${hourNowForAria} ${hourNowForAria === 1 ? 'hour' : 'hours'} ${display.period}`
          }
          disabled={isDisabled}
          onKeyDown={(e) => {
            switch (e.key) {
              case 'ArrowUp':
                e.preventDefault();
                incrementHours();
                break;
              case 'ArrowDown':
                e.preventDefault();
                decrementHours();
                break;
              case 'Backspace':
                e.preventDefault();
                handleBackspace('hour');
                break;
              /*case "Tab":
                handleBlur(e.currentTarget.name as "hour" | "minute", e.currentTarget.value);
                break;*/
              default:
                break;
            }
          }}
          onChange={(e) => {
            handleManualInput('hour', e.target.value);
          }}
          onBlur={(e) => {
            e.stopPropagation();
            handleBlur('hour', e.target.value);
          }}
        />
      </div>

      <div className="flex flex-col gap-2 items-center">
        <Label id={minuteLabelId} htmlFor={minuteInputId} className="self-center">
          Minutes
        </Label>
        <Input
          id={minuteInputId}
          name="minute"
          className={cn('w-14 text-center font-mono', className)}
          value={display.minutes}
          inputMode="numeric"
          pattern="[0-9]*"
          aria-invalid={isInvalid || undefined}
          aria-labelledby={minuteLabelId}
          aria-describedby={`${hintId}${isInvalid ? ` ${errorId}` : ''}`}
          role="spinbutton"
          aria-valuemin={0}
          aria-valuemax={59}
          aria-valuenow={minuteNow}
          aria-valuetext={`${minuteNow} minutes`}
          disabled={isDisabled}
          onKeyDown={(e) => {
            switch (e.key) {
              case 'ArrowUp':
                e.preventDefault();
                incrementMinutes();
                break;
              case 'ArrowDown':
                e.preventDefault();
                decrementMinutes();
                break;
              case 'Backspace':
                e.preventDefault();
                handleBackspace('minute');
                break;
              /*case "Tab":
                handleBlur(e.currentTarget.name as "hour" | "minute", e.currentTarget.value);
                break;*/
              default:
                break;
            }
          }}
          onChange={(e) => {
            handleManualInput('minute', e.target.value);
          }}
          onBlur={(e) => {
            e.stopPropagation();
            handleBlur('minute', e.target.value);
          }}
        />
      </div>

      {!is24HourTime && (
        <div className="flex flex-col gap-2 items-center">
          <Label id={periodLabelId} className="self-center">
            Period
          </Label>
          <div
            role="group"
            aria-labelledby={periodLabelId}
            className={cn(
              'bg-muted text-muted-foreground inline-flex h-9 w-fit items-center justify-center rounded-lg p-[3px]',
              isInvalid && 'ring-destructive/20 dark:ring-destructive/40 border-destructive border ring-1',
              isDisabled && 'bg-transparent',
            )}
            onKeyDown={(e) => {
              if (isDisabled) return;
              const buttons = Array.from(e.currentTarget.querySelectorAll('button'));
              const currentIndex = buttons.indexOf(document.activeElement as HTMLButtonElement);

              if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
                e.preventDefault();
                const nextIndex = currentIndex === 0 ? 1 : 0;
                buttons[nextIndex]?.focus();
              }
            }}
          >
            {(['AM', 'PM'] as const).map((p) => {
              const isSelected = display.period === p;
              return (
                <button
                  key={p}
                  type="button"
                  aria-pressed={isSelected}
                  tabIndex={isDisabled ? -1 : 0}
                  disabled={isDisabled}
                  onClick={() => togglePeriod(p)}
                  className={cn(
                    /* Base TabsTrigger styles */
                    'inline-flex h-[calc(100%-1px)] items-center justify-center gap-1.5 rounded-md border border-transparent px-3 py-1 text-sm font-medium whitespace-nowrap transition-[color,box-shadow] outline-none min-w-12',
                    'focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] focus-visible:outline-1',
                    'disabled:pointer-events-none disabled:opacity-75 disabled:text-muted-foreground',

                    /* Inactive State */
                    !isSelected && 'text-muted-foreground hover:bg-background/50 hover:border-ring',

                    /* Active State (matches data-[state=active]) */
                    isSelected && [
                      'bg-background text-foreground shadow-sm',
                      'dark:bg-input/30 dark:border-input dark:text-foreground',
                      'disabled:text-foreground disabled:border-input',
                    ],
                  )}
                >
                  {p}
                </button>
              );
            })}
          </div>
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

//OLD PERIOD TOGGLE
/*
<div className="flex flex-col gap-2 items-center">
          <Label id={periodLabelId} className="self-center">
            Period
          </Label>
          <Tabs value={display.period} onValueChange={(value) => togglePeriod()} aria-labelledby={periodLabelId}>
            <TabsList
              className="grid w-full grid-cols-2"
              aria-disabled={isDisabled}
              data-invalid={isInvalid || undefined}
              aria-invalid={isInvalid || undefined}
            >
              <TabsTrigger value="AM" disabled={isDisabled}>
                AM
              </TabsTrigger>
              <TabsTrigger value="PM" disabled={isDisabled}>
                PM
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

*/
