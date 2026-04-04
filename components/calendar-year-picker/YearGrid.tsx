import React, { useRef } from 'react';
import { Button } from '@/components/ui/button';

type YearGridProps = {
  yearList: number[];
  selectedYear: number;
  currentYear: number;
  onClickYear: (date: Date) => void;
  onNavigateBand: (direction: 'prev' | 'next') => void;
  firstYearRef?: React.RefObject<HTMLButtonElement | null>;
  lastYearRef?: React.RefObject<HTMLButtonElement | null>;

  lastFocusedYear: number | null;
  onUpdateLastFocusedYear: (year: number | null) => void;
};

export default function YearGrid({
  yearList,
  selectedYear,
  currentYear,
  onClickYear,
  onNavigateBand,
  firstYearRef,
  lastYearRef,

  lastFocusedYear,
  onUpdateLastFocusedYear,
}: YearGridProps) {
  const totalColumns = 4;

  const gridRef = useRef<HTMLDivElement | null>(null);
  const buttonRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const lastFocusedIndex = lastFocusedYear != null ? yearList.indexOf(lastFocusedYear) : -1;
  const tabbableIndex = lastFocusedIndex >= 0 ? lastFocusedIndex : 0;

  const lastIndex = yearList.length - 1;
  const lastRowStart = yearList.length - totalColumns;

  const deferFocus = (index: number) => {
    setTimeout(() => {
      buttonRefs.current[index]?.focus();
      onUpdateLastFocusedYear(yearList[index]);
    }, 0);
  };

  const specialHandlers: Record<string, (index: number) => void> = {
    Home: () => deferFocus(0),
    End: () => deferFocus(lastIndex),
    PageUp: (index) => {
      onNavigateBand('prev');
      deferFocus(index);
    },
    PageDown: (index) => {
      onNavigateBand('next');
      deferFocus(index);
    },
    ArrowRight: (index) => moveByOffset(index, 1, 0),
    ArrowLeft: (index) => moveByOffset(index, -1, lastIndex),
    ArrowDown: (index) => moveByOffset(index, totalColumns, index % totalColumns),
    ArrowUp: (index) => moveByOffset(index, -totalColumns, lastRowStart + (index % totalColumns)),
  };

  const moveByOffset = (index: number, offset: number, fallback: number) => {
    const nextIndex = index + offset;
    const col = index % totalColumns;

    if (nextIndex < 0) {
      onNavigateBand('prev');
      deferFocus(fallback);
    } else if (nextIndex >= yearList.length) {
      onNavigateBand('next');
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
      aria-label="Year selection"
      className="grid grid-cols-4 gap-x-0.5 gap-y-1.5"
      tabIndex={-1}
      onFocus={(e) => {
        if (e.target === gridRef.current) {
          buttonRefs.current[tabbableIndex]?.focus();
        }
      }}
    >
      {yearList.map((year, index) => {
        const isSelected = year === selectedYear;
        const isCurrent = year === currentYear;
        const isTodayInYear = year === new Date().getFullYear();

        const isTabbable = index === tabbableIndex;

        return (
          <Button
            ref={(el) => {
              buttonRefs.current[index] = el;
              if (index === 0 && firstYearRef) firstYearRef.current = el;
              if (index === lastIndex && lastYearRef) lastYearRef.current = el;
            }}
            role="gridcell"
            key={year}
            aria-selected={isSelected}
            aria-current={isCurrent ? 'date' : undefined}
            aria-label={`Year ${year}${isCurrent ? ', current year' : ''}${isSelected ? ', selected' : ''}`}
            type="button"
            tabIndex={isTabbable ? 0 : -1}
            onFocus={() => {
              onUpdateLastFocusedYear(year);
            }}
            onKeyDown={(e) => handleKeyNavigation(e, index)}
            onClick={() => {
              onUpdateLastFocusedYear(year);
              onClickYear(new Date(year, 0, 1));
            }}
            className={`size-14 p-2  focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1 hover:text-primary-foreground  hover:bg-primary/50 
            ${isSelected ? 'bg-primary font-semibold text-primary-foreground' : ''}
            ${isTodayInYear && !isSelected ? 'bg-accent text-accent-foreground' : ''}
            `}
            variant={'ghost'}
          >
            <div className="flex flex-col justify-center align-middle">
              <div className="flex size-6 items-center justify-center rounded-full text-xs font-medium">{year}</div>
            </div>
          </Button>
        );
      })}
    </div>
  );
}

/*
  const handleKeyNavigation = (e: React.KeyboardEvent<HTMLButtonElement>, index: number) => {
    if (!handledKeys.has(e.key)) return;

    e.preventDefault();

    if (e.key === "Home") {
      deferFocus(0);
      return;
    }

    if (e.key === "End") {
      deferFocus(lastIndex);
      return;
    }

    if (e.key === "PageUp") {
      onNavigateBand("prev");
      deferFocus(index);
      return;
    }

    if (e.key === "PageDown") {
      onNavigateBand("next");
      deferFocus(index);
      return;
    }

    const offset = keyMap[e.key];
    if (offset === undefined) return;

    const nextIndex = index + offset;
    const col = index % totalColumns;

    if (nextIndex < 0) {
      onNavigateBand("prev");
      const targetIndex = e.key === "ArrowLeft" ? lastIndex : lastRowStart + col;
      deferFocus(targetIndex);
    } else if (nextIndex >= years.length) {
      onNavigateBand("next");
      const targetIndex = e.key === "ArrowRight" ? 0 : col;
      deferFocus(targetIndex);
    } else {
      deferFocus(nextIndex);
    }
  };
*/
