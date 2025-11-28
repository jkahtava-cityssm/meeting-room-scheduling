import React, { useRef } from "react";
import { useRouter } from "next/navigation";
import { format, startOfYear } from "date-fns";
import { Button } from "@/components/ui/button";

import { navigateURL } from "@/lib/helpers";

import YearGrid from "./YearGrid";

import YearBandNavigation from "./YearBandNavigation";
import { useYearBands } from "./useYearBands";

export default function CalendarYearPicker({ selectedDate }: { selectedDate: Date }) {
  const [currentDate, setCurrentDate] = React.useState<Date>(selectedDate);
  const [lastFocusedYear, setLastFocusedYear] = React.useState<number | null>(null);

  const selectedYear = Number(format(selectedDate, "yyyy"));
  const currentYear = Number(format(currentDate, "yyyy"));
  const { push } = useRouter();

  const { bands, yearList, bandLabel } = useYearBands(currentYear);

  const firstYearRef = useRef<HTMLButtonElement | null>(null);
  const lastYearRef = useRef<HTMLButtonElement | null>(null);

  const handleNavigate = (date: Date) => {
    push(navigateURL(date, "year"));
  };

  const navigateBlock = (direction: "prev" | "next") => {
    const { start, end } = getBlockBounds(currentYear);
    const targetYear = direction === "prev" ? start - 1 : end + 1;
    setCurrentDate(new Date(targetYear, 0, 1));
    setTimeout(() => {
      if (direction === "prev") lastYearRef.current?.focus();
      else firstYearRef.current?.focus();
    }, 0);
  };

  return (
    <div className="flex flex-col">
      {/* Navigation */}

      <YearBandNavigation
        currentDate={currentDate}
        onYearChange={(date) => setCurrentDate(date)}
        onNavigateBand={navigateBlock}
        bands={bands}
        bandLabel={bandLabel}
      />

      {/* Live region */}
      <div aria-live="polite" className="sr-only">
        Showing years {yearList[0]} to {yearList[yearList.length - 1]}
      </div>

      {/* Year Grid */}
      <div className="flex-1 mx-8 mb-1.5 min-h-65">
        <div className="flex justify-center w-full mt-2">
          <div className="text-xs font-medium text-muted-foreground h-4">aa</div>
        </div>
        <YearGrid
          yearList={yearList}
          selectedYear={selectedYear}
          currentYear={currentYear}
          onClickYear={(date) => handleNavigate(date)}
          onNavigateBand={navigateBlock}
          lastFocusedYear={lastFocusedYear}
          onUpdateLastFocusedYear={(year) => setLastFocusedYear(year)}
          firstYearRef={firstYearRef}
          lastYearRef={lastYearRef}
        />
      </div>

      {/* Today Button */}
      <div className="bg-accent rounded-bl-sm rounded-br-sm pl-3 pr-3">
        <Button
          variant="outline"
          size="sm"
          className="m-1 focus:ring-2 focus:ring-primary"
          onClick={() => {
            const today = startOfYear(new Date());
            setCurrentDate(today);
            handleNavigate(today);
          }}
          aria-label="Go to current year"
        >
          Today
        </Button>
      </div>
    </div>
  );
}

function getBlockBounds(year: number, blockSize = 16) {
  const start = year - ((year - 1) % blockSize);
  const end = start + blockSize - 1;
  return { start, end };
}
