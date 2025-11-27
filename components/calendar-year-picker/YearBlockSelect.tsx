import React from "react";
import { parse } from "date-fns";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";

export default function YearBlockSelect({
  selectedDate,
  blocks,
  currentBlockLabel,
  onYearChange,
}: {
  selectedDate: Date;
  blocks: number[][];
  currentBlockLabel: string;
  onYearChange?: (date: Date) => void;
}) {
  const selectedYear = selectedDate.getFullYear();

  return (
    <Select
      value={currentBlockLabel}
      onValueChange={(value) => {
        const [startStr] = value.split(" - ");
        const nextYear = Number(startStr);
        const parsed = parse(String(nextYear), "yyyy", new Date());
        onYearChange?.(parsed);
      }}
    >
      <SelectTrigger aria-label={`Current block: ${currentBlockLabel}`} className="w-48">
        <div className="flex justify-center items-center w-full">
          <SelectValue />
        </div>
      </SelectTrigger>
      <SelectContent position="popper">
        <ScrollArea className="h-40">
          {blocks.map((block, idx) => {
            const label = `${block[0]} - ${block[block.length - 1]}`;
            return (
              <SelectItem key={idx} value={label} className="flex justify-center items-center w-full">
                {label}
              </SelectItem>
            );
          })}
          <ScrollBar forceMount orientation="vertical" />
        </ScrollArea>
      </SelectContent>
    </Select>
  );
}
