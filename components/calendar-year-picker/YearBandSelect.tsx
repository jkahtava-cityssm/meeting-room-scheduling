import React from "react";
import { parse } from "date-fns";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";

export default function YearBandSelect({
  selectedDate,
  bands,
  bandLabel,
  onYearChange,
}: {
  selectedDate: Date;
  bands: number[][];
  bandLabel: string;
  onYearChange?: (date: Date) => void;
}) {
  const selectedYear = selectedDate.getFullYear();

  return (
    <Select
      value={bandLabel}
      onValueChange={(value) => {
        const [startStr] = value.split(" - ");
        const nextYear = Number(startStr);
        const parsed = parse(String(nextYear), "yyyy", new Date());
        onYearChange?.(parsed);
      }}
    >
      <SelectTrigger aria-label={`Current band: ${bandLabel}`} className="w-48">
        <div className="flex justify-center items-center w-full">
          <SelectValue />
        </div>
      </SelectTrigger>
      <SelectContent position="popper">
        <ScrollArea className="h-40">
          {bands.map((band, idx) => {
            const label = `${band[0]} - ${band[band.length - 1]}`;
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
