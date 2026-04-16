import { useRouter } from 'next/navigation';

import React, { useMemo, useRef } from 'react';

import { navigateURL } from '@/lib/helpers';

import { addMonths, addYears, format, isSameMonth, parse, startOfMonth, startOfYear } from 'date-fns';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import MonthPickerNavigation from './MonthPickerNavigation';
import { date } from 'zod';
import MonthGrid from './MonthGrid';

export default function CalendarMonthPicker({ selectedDate }: { selectedDate: Date }) {
  const [currentDate, setCurrentDate] = React.useState<Date>(selectedDate);
  const [lastFocusedMonth, setLastFocusedMonth] = React.useState<Date | null>(null);

  const firstMonthRef = useRef<HTMLButtonElement | null>(null);
  const lastMonthRef = useRef<HTMLButtonElement | null>(null);

  const { push } = useRouter();

  const handleNavigate = (date: Date) => {
    push(navigateURL(date, 'month'));
  };

  const navigateBlock = (direction: 'prev' | 'next') => {
    setCurrentDate(addYears(currentDate, direction === 'prev' ? -1 : 1));
    setTimeout(() => {
      if (direction === 'prev') lastMonthRef.current?.focus();
      else firstMonthRef.current?.focus();
    }, 0);
  };

  const monthList = useMemo(() => {
    const yearStart = startOfYear(currentDate);
    return Array.from({ length: 12 }, (_, i) => addMonths(yearStart, i));
  }, [currentDate]);

  return (
    <div className="flex flex-col">
      <MonthPickerNavigation currentDate={currentDate} onMonthChange={(date: Date) => setCurrentDate(date)} onNavigate={navigateBlock} />

      <div className="flex-1 mx-8 mb-3 min-h-65">
        <MonthGrid
          className={'pt-6'}
          monthList={monthList}
          selectedMonth={selectedDate}
          currentMonth={currentDate}
          onClickMonth={(date) => handleNavigate(date)}
          onNavigate={navigateBlock}
          lastFocusedMonth={lastFocusedMonth}
          onUpdateLastFocusedMonth={(date) => setLastFocusedMonth(date)}
          firstMonthRef={firstMonthRef}
          lastMonthRef={lastMonthRef}
        />
      </div>
      <div className="bg-accent rounded-bl-sm rounded-br-sm  pl-3 pr-3">
        <Button
          variant="outline"
          size="sm"
          className="m-1 focus:ring-2 focus:ring-primary"
          onClick={() => {
            const today = startOfMonth(new Date());
            setCurrentDate(today);
            handleNavigate(today);
          }}
          aria-label="Go to current month"
        >
          Today
        </Button>
      </div>
    </div>
  );
}
