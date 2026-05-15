import React, { useRef } from 'react';
import { Button } from '@/components/ui/button';
import { format, isSameMonth } from 'date-fns';
import { cn } from '@/lib/utils';

type MonthGridProps = {
  monthList: Date[];
  selectedMonth: Date;
  currentMonth: Date;
  onClickMonth: (date: Date) => void;
  onNavigate: (direction: 'prev' | 'next') => void;
  firstMonthRef?: React.RefObject<HTMLButtonElement | null>;
  lastMonthRef?: React.RefObject<HTMLButtonElement | null>;
  className?: string;
  lastFocusedMonth: Date | null;
  onUpdateLastFocusedMonth: (date: Date | null) => void;
};

export default function MonthGrid({
  monthList,
  selectedMonth,
  currentMonth,
  onClickMonth,
  onNavigate,
  firstMonthRef,
  lastMonthRef,
  className,
  lastFocusedMonth,
  onUpdateLastFocusedMonth,
}: MonthGridProps) {
  const totalColumns = 4;

  const gridRef = useRef<HTMLDivElement | null>(null);
  const buttonRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const lastFocusedIndex = lastFocusedMonth != null ? monthList.indexOf(lastFocusedMonth) : -1;
  const tabbableIndex = lastFocusedIndex >= 0 ? lastFocusedIndex : 0;

  const lastIndex = monthList.length - 1;
  const lastRowStart = monthList.length - totalColumns;

  const deferFocus = (index: number) => {
    setTimeout(() => {
      buttonRefs.current[index]?.focus();
      onUpdateLastFocusedMonth(monthList[index]);
    }, 0);
  };

  const specialHandlers: Record<string, (index: number) => void> = {
    Home: () => deferFocus(0),
    End: () => deferFocus(lastIndex),
    PageUp: (index) => {
      onNavigate('prev');
      deferFocus(index);
    },
    PageDown: (index) => {
      onNavigate('next');
      deferFocus(index);
    },
    ArrowRight: (index) => moveByOffset(index, 1, 0),
    ArrowLeft: (index) => moveByOffset(index, -1, lastIndex),
    ArrowDown: (index) => moveByOffset(index, totalColumns, index % totalColumns),
    ArrowUp: (index) => moveByOffset(index, -totalColumns, lastRowStart + (index % totalColumns)),
  };

  const moveByOffset = (index: number, offset: number, fallback: number) => {
    const nextIndex = index + offset;

    if (nextIndex < 0) {
      onNavigate('prev');
      deferFocus(fallback);
    } else if (nextIndex >= monthList.length) {
      onNavigate('next');
      deferFocus(fallback);
    } else {
      deferFocus(nextIndex);
    }
  };

  const handleKeyNavigation = (e: React.KeyboardEvent<HTMLButtonElement>, index: number) => {
    const handler = specialHandlers[e.key];
    if (!handler) return;

    e.preventDefault();
    handler(index);
  };

  return (
    <div
      ref={gridRef}
      role="grid"
      aria-label="Month selection"
      className={cn('grid grid-cols-4 gap-x-0.5 gap-y-2', className)}
      tabIndex={-1}
      onFocus={(e) => {
        if (e.target === gridRef.current) {
          buttonRefs.current[tabbableIndex]?.focus();
        }
      }}
    >
      {monthList.map((date, index) => {
        const month = format(date, 'MMM');

        const isSelected = isSameMonth(date, selectedMonth);
        const isCurrent = isSameMonth(date, currentMonth);
        const isTodayInMonth = isSameMonth(date, new Date());

        const isTabbable = index === tabbableIndex;
        return (
          <Button
            ref={(el) => {
              buttonRefs.current[index] = el;
              if (index === 0 && firstMonthRef) firstMonthRef.current = el;
              if (index === lastIndex && lastMonthRef) lastMonthRef.current = el;
            }}
            role="gridcell"
            key={month}
            aria-selected={isSelected}
            aria-current={isCurrent ? 'date' : undefined}
            aria-label={`Month ${format(date, 'MMMM')}${isCurrent ? ', current month' : ''}${isSelected ? ', selected' : ''}`}
            type="button"
            tabIndex={isTabbable ? 0 : -1}
            onFocus={() => {
              onUpdateLastFocusedMonth(date);
            }}
            onKeyDown={(e) => handleKeyNavigation(e, index)}
            onClick={() => {
              onUpdateLastFocusedMonth(date);
              onClickMonth(date);
            }}
            className={`size-14 p-2  focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1 hover:text-primary-foreground  hover:bg-primary/50 
                      ${isSelected ? 'bg-primary font-semibold text-primary-foreground' : ''}
                      ${isTodayInMonth && !isSelected ? 'bg-accent text-accent-foreground' : ''}
                      `}
            variant={'ghost'}
          >
            <div className="flex flex-col justify-center align-middle">
              <div className="flex size-6 items-center justify-center rounded-full text-xs font-medium">{month}</div>
            </div>
          </Button>
        );
      })}
    </div>
  );
}
