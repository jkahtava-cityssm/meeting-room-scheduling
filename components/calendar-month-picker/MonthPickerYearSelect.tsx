import { addYears, format, parse, startOfYear } from 'date-fns';
import { useMemo } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { ScrollArea, ScrollBar } from '../ui/scroll-area';

export function MonthPickerYearSelect({ selectedDate, onMonthChange }: { selectedDate: Date; onMonthChange?: (date: Date) => void }) {
  const years = useMemo(() => {
    const yearStart = startOfYear(selectedDate);
    const nextYearList = Array.from({ length: 25 }, (_, i) => addYears(yearStart, i + 1));
    const previousYearList = Array.from({ length: 26 }, (_, i) => addYears(yearStart, i * -1));

    return [...previousYearList.reverse(), ...nextYearList];
  }, [selectedDate]);

  return (
    <Select
      value={format(selectedDate, 'yyyy')}
      onValueChange={(value) => {
        const parsed = parse(value, 'yyyy', new Date());

        onMonthChange?.(parsed);
      }}
    >
      <SelectTrigger aria-label={`${format(selectedDate, 'yyyy')}`} className={`pr-1.5 focus:ring-0 w-48`}>
        <div className="flex justify-center items-center w-full">
          <SelectValue />
        </div>
      </SelectTrigger>
      <SelectContent position="popper">
        <ScrollArea className="h-40">
          {years?.map((year, id: number) => {
            return (
              <SelectItem key={`${format(year, 'yyyy')}-${id}`} value={format(year, 'yyyy')} className="flex justify-center items-center w-full">
                {format(year, 'yyyy')}
              </SelectItem>
            );
          })}
          <ScrollBar forceMount orientation="vertical"></ScrollBar>
        </ScrollArea>
      </SelectContent>
    </Select>
  );
}
