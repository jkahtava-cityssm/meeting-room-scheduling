import React, { useRef } from "react";
import { useRouter } from "next/navigation";
import { format, startOfYear } from "date-fns";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { navigateURL } from "@/lib/helpers";
import YearBlockSelect from "./YearBlockSelect";
import YearGrid from "./YearGrid";

import YearBlockNavigation from "./YearBlockNavigation";
import { useYearBlocks } from "./useYearBlocks";

export default function SingleCalendarYear({ selectedDate }: { selectedDate: Date }) {
  const [currentDate, setCurrentDate] = React.useState<Date>(selectedDate);
  const [lastFocusedYear, setLastFocusedYear] = React.useState<number | null>(null);

  const selectedYear = Number(format(selectedDate, "yyyy"));
  const currentYear = Number(format(currentDate, "yyyy"));
  const { push } = useRouter();

  const { blocks, currentBlock, currentBlockLabel } = useYearBlocks(currentYear);

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

      <YearBlockNavigation
        currentDate={currentDate}
        onYearChange={(date) => setCurrentDate(date)}
        onNavigateBlock={navigateBlock}
        blocks={blocks}
        currentBlockLabel={currentBlockLabel}
      />

      {/* Live region */}
      <div aria-live="polite" className="sr-only">
        Showing years {currentBlock[0]} to {currentBlock[currentBlock.length - 1]}
      </div>

      {/* Year Grid */}
      <div className="flex-1 mx-8 pb-1 min-h-65">
        <YearGrid
          years={currentBlock}
          selectedYear={selectedYear}
          currentYear={currentYear}
          cols={4}
          onNavigateYear={(date) => handleNavigate(date)}
          onNavigateBlock={navigateBlock}
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
