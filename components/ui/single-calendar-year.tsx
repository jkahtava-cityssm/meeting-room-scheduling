import { useRouter } from "next/navigation";

import React, { useMemo, useRef } from "react";

import { navigateURL } from "@/lib/helpers";

import {
  addMonths,
  addYears,
  format,
  isSameMonth,
  isSameYear,
  parse,
  startOfDecade,
  startOfMonth,
  startOfYear,
} from "date-fns";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";

export default function SingleCalendarYear({ selectedDate }: { selectedDate: Date }) {
  const [currentDate, setCurrentDate] = React.useState<Date>(selectedDate);
  const selectedYear = Number(format(selectedDate, "yyyy"));
  const currentYear = Number(format(currentDate, "yyyy"));

  const buttonRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const { push } = useRouter();

  const handleNavigate = (date: Date) => {
    push(navigateURL(date, "year"));
  };

  const years = useMemo(() => {
    return generateSingleBlock(currentYear); //[...previousYearList.reverse(), ...nextYearList];
  }, [currentYear]);

  return (
    <div className="flex flex-col">
      <div className="flex items-center w-full justify-between mt-1">
        <Button
          variant={"outline"}
          className="h-7 w-7 bg-transparent p-1 m-2 ml-auto hover:opacity-100 [&_svg]:fill-foreground  shadow-xs"
          onClick={() => navigateBlock("prev", currentYear, setCurrentDate, buttonRefs)}
          aria-label="Previous block of years"
        >
          <ChevronLeft className={"h-4 w-4"}></ChevronLeft>
        </Button>
        <div className="flex items-center gap-1 2 ">
          <Selection
            selectedDate={currentDate}
            onYearChange={(date) => {
              setCurrentDate(date);
            }}
          ></Selection>
        </div>
        <Button
          variant={"outline"}
          className="h-7 w-7 bg-transparent p-1 m-2 mr-auto  hover:opacity-100 [&_svg]:fill-foreground  shadow-xs"
          onClick={() => navigateBlock("next", currentYear, setCurrentDate, buttonRefs)}
          aria-label="Next block of years"
        >
          <ChevronRight className={"h-4 w-4"}></ChevronRight>
        </Button>
      </div>

      <div aria-live="polite" className="sr-only">
        Showing years {years[0]} to {years[years.length - 1]}
      </div>

      <div className="flex-1 mx-8 pb-1 min-h-65">
        <div className="flex justify-center w-full mt-2">
          <div className="text-xs font-medium text-muted-foreground h-4"></div>
        </div>

        <div role="grid" aria-label="Year selection" className="grid grid-cols-4 gap-x-0.5 gap-y-2">
          {years.map((year, index) => {
            const isSelected = year === selectedYear;
            const isCurrent = year === currentYear;
            return (
              <Button
                ref={(el) => {
                  buttonRefs.current[index] = el;
                }}
                role="gridcell"
                aria-label={`Year ${year}${isCurrent ? ", current year" : ""}${isSelected ? ", selected" : ""}`}
                aria-selected={isSelected}
                aria-current={isCurrent ? "date" : undefined}
                tabIndex={0}
                onKeyDown={(e) => {
                  handleKeyNavigation(e, index, years, buttonRefs, setCurrentDate);
                }}
                variant={"ghost"}
                key={year}
                onClick={() => {
                  handleNavigate(toYearDate(year));
                }}
                type="button"
                className={` size-14 p-2 ${isSelected && "bg-primary font-semibold text-primary-foreground"}`}
              >
                <div className="flex flex-col justify-center align-middle">
                  <div className={`flex size-6 items-center justify-center rounded-full text-xs font-medium`}>
                    {year}
                  </div>
                </div>
              </Button>
            );
          })}
        </div>
      </div>
      <div className="bg-accent rounded-bl-sm rounded-br-sm  pl-3 pr-3">
        <Button
          aria-label="Go to current year"
          variant={"outline"}
          size={"sm"}
          className="m-1"
          onClick={() => {
            const today = startOfYear(new Date());
            setCurrentDate(today);
            handleNavigate(today);
          }}
        >
          Today
        </Button>
      </div>
    </div>
  );
}

function Selection({ selectedDate, onYearChange }: { selectedDate: Date; onYearChange?: (date: Date) => void }) {
  const selectedYear = Number(format(selectedDate, "yyyy"));

  const years = useMemo(() => {
    return generateYearBlocks(selectedYear); //[...previousYearList.reverse(), ...nextYearList];
  }, [selectedYear]);

  const currentBlock = findBlockByYear(years, selectedYear) || [];

  const currentBlockStart = getBlockStart(selectedYear);

  const currentBlockLabel = getBlockLabel(currentBlock);

  return (
    <Select
      value={currentBlockLabel}
      onValueChange={(value) => {
        const [startStr, endStr] = value.split(" - ");
        const start = Number(startStr);
        const end = Number(endStr);

        const nextYear = isYearInBlock(selectedYear, [start, end]) ? selectedYear : start;
        const parsed = parse(String(nextYear), "yyyy", new Date());
        onYearChange?.(parsed);
      }}
    >
      <SelectTrigger aria-label={`${selectedYear}`} className={`pr-1.5 focus:ring-0 w-48`}>
        <div className="flex-1">
          <SelectValue className=" text-center" />
        </div>
      </SelectTrigger>
      <SelectContent position="popper">
        <ScrollArea className="h-40">
          {years?.map((year, id: number) => {
            const blockLabel = getBlockLabel(year);
            return (
              <SelectItem key={`${blockLabel}-${id}`} value={`${blockLabel}`} className="flex-1 text-center">
                {blockLabel}
              </SelectItem>
            );
          })}
          <ScrollBar forceMount orientation="vertical"></ScrollBar>
        </ScrollArea>
      </SelectContent>
    </Select>
  );
}

function getBlockLabel(block: number[]) {
  return `${block[0]} - ${block[block.length - 1]}`;
}

function getBlockStart(year: number, blockSize = 16) {
  return year - ((year - 1) % blockSize);
}

function getBlockEnd(year: number, blockSize = 16): number {
  const startYear = year - ((year - 1) % blockSize);
  return startYear + blockSize - 1;
}

function isYearInBlock(year: number, block: number[]) {
  return year >= block[0] && year <= block[block.length - 1];
}

function findBlockByYear(blocks: number[][], selectedYear: number): number[] | null {
  return blocks.find((block) => selectedYear >= block[0] && selectedYear <= block[block.length - 1]) || null;
}

function generateYearBlocks(selectedYear: number, blockSize = 16, totalBlocks = 9): number[][] {
  const safeBlockSize = Math.max(1, Math.floor(blockSize));
  const safeTotalBlocks = Math.max(1, Math.floor(totalBlocks));
  const beforeBlocks = Math.floor(safeTotalBlocks / 2);

  const startYear = selectedYear - ((selectedYear - 1) % safeBlockSize);

  return Array.from({ length: totalBlocks }, (_, i) => {
    const blockStartYear = startYear + (i - beforeBlocks) * safeBlockSize;
    return generateSingleBlock(blockStartYear, safeBlockSize);
  });
}

function generateSingleBlock(selectedYear: number, blockSize = 16): number[] {
  const startYear = selectedYear - ((selectedYear - 1) % blockSize);
  return Array.from({ length: blockSize }, (_, i) => startYear + i);
}

const toYearDate = (year: number) => new Date(year, 0, 1);

const yearOf = (date: Date) => Number(format(date, "yyyy"));

const getBlockBounds = (year: number, blockSize = 16) => {
  const start = year - ((year - 1) % blockSize);
  const end = start + blockSize - 1;
  return { start, end };
};

function navigateBlock(
  direction: "prev" | "next",
  currentYear: number,
  setCurrentDate: (date: Date) => void,
  buttonRefs: React.RefObject<(HTMLButtonElement | null)[]>
) {
  const { start, end } = getBlockBounds(currentYear);
  const targetYear = direction === "prev" ? start - 1 : end + 1;
  setCurrentDate(toYearDate(targetYear));

  //Move focus to first year in the new block after navigation
  setTimeout(() => buttonRefs.current[0]?.focus(), 0);
}

function handleKeyNavigation(
  e: React.KeyboardEvent<HTMLButtonElement>,
  index: number,
  years: number[],
  buttonRefs: React.RefObject<(HTMLButtonElement | null)[]>,
  setCurrentDate: (date: Date) => void
) {
  const cols = 4;
  const col = index % cols;
  let nextIndex = index;

  switch (e.key) {
    case "ArrowRight":
      nextIndex = index === years.length - 1 ? 0 : index + 1;
      break;
    case "ArrowLeft":
      nextIndex = index === 0 ? years.length - 1 : index - 1;
      break;
    case "ArrowDown":
      nextIndex = index + cols;
      break;
    case "ArrowUp":
      nextIndex = index - cols;
      break;
    default:
      return;
  }

  e.preventDefault();

  if (nextIndex < 0) {
    // Move to previous block and focus last element
    navigateBlock("prev", years[index], setCurrentDate, buttonRefs);
    setTimeout(() => {
      const lastRowStart = Math.floor((years.length - 1) / cols) * cols;
      const targetIndex = Math.min(lastRowStart + col, years.length - 1);
      buttonRefs.current[targetIndex]?.focus();
    }, 0);
  } else if (nextIndex >= years.length) {
    // Move to next block and focus first element
    navigateBlock("next", years[index], setCurrentDate, buttonRefs);
    setTimeout(() => {
      const targetIndex = Math.min(col, years.length - 1);
      buttonRefs.current[targetIndex]?.focus();
    }, 0);
  } else {
    // Stay in current block
    buttonRefs.current[nextIndex]?.focus();
  }
}
