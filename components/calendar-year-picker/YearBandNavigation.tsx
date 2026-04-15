import React from 'react';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import YearBandSelect from './YearBandSelect';

export default function YearBandNavigation({
  currentDate,
  onYearChange,
  onNavigateBand,
  bands,
  bandLabel,
}: {
  currentDate: Date;
  onYearChange: (date: Date) => void;
  onNavigateBand: (direction: 'prev' | 'next') => void;
  bands: number[][];
  bandLabel: string;
}) {
  return (
    <div className="flex items-center w-full justify-between mt-1">
      <Button
        variant="outline"
        className="h-7 w-7 bg-transparent p-1 m-2 ml-auto hover:opacity-100 shadow-xs focus:ring-2 focus:ring-primary"
        onClick={() => onNavigateBand('prev')}
        aria-label="Previous band of years"
      >
        <ChevronLeft className="h-4 w-4  fill-foreground" />
      </Button>

      <div className="flex items-center gap-1">
        <YearBandSelect selectedDate={currentDate} bands={bands} bandLabel={bandLabel} onYearChange={onYearChange} />
      </div>

      <Button
        variant="outline"
        className="h-7 w-7 bg-transparent p-1 m-2 mr-auto hover:opacity-100 shadow-xs focus:ring-2 focus:ring-primary"
        onClick={() => onNavigateBand('next')}
        aria-label="Next band of years"
      >
        <ChevronRight className="h-4 w-4  fill-foreground" />
      </Button>
    </div>
  );
}
