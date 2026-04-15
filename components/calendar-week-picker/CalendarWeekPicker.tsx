import { navigateURL } from '@/lib/helpers';
import { addYears } from 'date-fns';

import { useState } from 'react';
import { DayPicker } from '../ui/day-picker';
import { useRouter } from 'next/navigation';

export function CalendarWeekPicker({ selectedDate }: { selectedDate: Date }) {
  const [currentDate, setCurrentDate] = useState<Date>(selectedDate);
  const { push } = useRouter();

  const handleNavigate = (date: Date) => {
    push(navigateURL(date, 'week'));
  };

  return (
    <DayPicker
      className="mx-auto w-fit"
      mode="single"
      selected={selectedDate}
      onSelect={handleNavigate}
      month={currentDate}
      onMonthChange={setCurrentDate}
      fixedWeeks={true}
      required
      onToday={() => handleNavigate(new Date())}
      startMonth={addYears(currentDate, -25)}
      endMonth={addYears(currentDate, 25)}
    />
  );
}
