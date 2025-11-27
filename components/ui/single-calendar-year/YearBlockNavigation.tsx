import React from "react";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import YearBlockSelect from "./YearBlockSelect";

export default function YearBlockNavigation({
  currentDate,
  onYearChange,
  onNavigateBlock,
  blocks,
  currentBlockLabel,
}: {
  currentDate: Date;
  onYearChange: (date: Date) => void;
  onNavigateBlock: (direction: "prev" | "next") => void;
  blocks: number[][];
  currentBlockLabel: string;
}) {
  return (
    <div className="flex items-center w-full justify-between mt-1">
      <Button
        variant="outline"
        className="h-7 w-7 bg-transparent p-1 m-2 ml-auto hover:opacity-100 shadow-xs focus:ring-2 focus:ring-primary"
        onClick={() => onNavigateBlock("prev")}
        aria-label="Previous block of years"
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>

      <div className="flex items-center gap-1">
        <YearBlockSelect
          selectedDate={currentDate}
          blocks={blocks}
          currentBlockLabel={currentBlockLabel}
          onYearChange={onYearChange}
        />
      </div>

      <Button
        variant="outline"
        className="h-7 w-7 bg-transparent p-1 m-2 mr-auto hover:opacity-100 shadow-xs focus:ring-2 focus:ring-primary"
        onClick={() => onNavigateBlock("next")}
        aria-label="Next block of years"
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
}
