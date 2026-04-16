import { addYears, format } from 'date-fns';

import { useDisclosure } from '@/hooks/use-disclosure';

import { Button } from '@/components/ui/button';
import { DayPicker } from '@/components/ui/day-picker';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

import { cn } from '@/lib/utils';

import type { ButtonHTMLAttributes } from 'react';
import React, { useState } from 'react';
import { dateMatchModifiers, Matcher } from 'react-day-picker';

type TProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'onSelect' | 'value'> & {
  onSelect: (value: Date | undefined) => void;
  value: Date;
  placeholder: string;
  labelVariant?: 'P' | 'PP' | 'PPP';
  children?: React.ReactNode;
  disableDays?: Matcher;
};

function CalendarDayPopover({ id, onSelect, className, placeholder, labelVariant = 'PPP', value, children, disableDays, ...props }: TProps) {
  const { isOpen, onClose, onToggle } = useDisclosure();
  const [calendarDate, setCalendarDate] = useState(value);

  const today = new Date();
  const isTodayDisabled = disableDays ? dateMatchModifiers(today, disableDays) : false;

  const handleSelect = (date: Date | undefined) => {
    onSelect(date);
    onClose();
  };

  const handleToday = () => {
    const today = new Date();

    if (isTodayDisabled) {
      return;
    }
    onSelect(today);
    onClose();
  };

  const onOpenChange = (open: boolean) => {
    if (value !== calendarDate && open) {
      setCalendarDate(value);
    }
    onToggle();
  };

  return (
    <Popover open={isOpen} onOpenChange={onOpenChange} modal>
      <PopoverTrigger asChild>
        {children ? (
          children
        ) : (
          <Button
            id={id}
            variant="outline"
            className={cn(
              'group relative h-9 w-full justify-start whitespace-nowrap px-3 py-2 font-normal hover:bg-inherit disabled:opacity-75',
              className,
            )}
            {...props}
          >
            {value && <span>{format(value, labelVariant)}</span>}
            {!value && <span className="text-muted-foreground">{placeholder}</span>}
          </Button>
        )}
      </PopoverTrigger>

      <PopoverContent align="center" className="w-fit p-0">
        <DayPicker
          mode="single"
          selected={value}
          onSelect={handleSelect}
          month={calendarDate}
          onMonthChange={setCalendarDate}
          required
          onToday={handleToday}
          startMonth={addYears(value, -25)}
          endMonth={addYears(value, 25)}
          fixedWeeks={true}
          disabled={disableDays}
          disableToday={isTodayDisabled}
          modifiersClassNames={{
            disabled: 'text-red-300  pointer-events-none ',

            today: 'bg-transparent font-normal text-foreground',

            outside: 'text-muted-foreground ',
          }}
        />
      </PopoverContent>
    </Popover>
  );
}

export { CalendarDayPopover };
