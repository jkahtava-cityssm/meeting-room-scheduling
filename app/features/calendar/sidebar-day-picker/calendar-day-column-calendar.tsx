'use client';
import { IEventSingleRoom } from '@/lib/schemas';

import { addYears } from 'date-fns';
import { useState } from 'react';
import { TCalendarView } from '@/lib/types';
import { navigateURL } from '@/lib/helpers';
import { useRouter } from 'next/navigation';
import { CalendarDayColumnCurrentEvents } from './calendar-day-column-current-events';
import { DayPicker } from '@/components/ui/day-picker';
import { Skeleton } from '@/components/ui/skeleton';

export function CalendarDayColumnCalendar({
  date,
  isLoading,
  events,
  view,
}: {
  date: Date;
  isLoading: boolean;
  events: IEventSingleRoom[];
  view: TCalendarView;
}) {
  const [calendarDate, setCalendarDate] = useState(date);

  const { push } = useRouter();

  /*const [currentMonth, setCurrentMonth] = React.useState<Date | undefined>(
    selected instanceof Date ? selected : undefined
  );*/

  const handleToday = () => {
    setCalendarDate(new Date());

    push(navigateURL(new Date(), view));
  };

  return (
    <div className="hidden w-74 divide-y border-l md:flex flex-col h-full shrink-0">
      <DayPicker
        className="mx-auto w-fit"
        mode="single"
        selected={date}
        onSelect={(value) => {
          push(navigateURL(value, view));
        }}
        month={calendarDate}
        onMonthChange={setCalendarDate}
        fixedWeeks={true}
        required
        onToday={handleToday}
        startMonth={addYears(date, -25)}
        endMonth={addYears(date, 25)}
      />
      {isLoading ? (
        <div className="flex-1 space-y-2">
          <div className="flex items-start gap-1 px-4 pt-4">
            <Skeleton className="w-full h-4"></Skeleton>
          </div>
          <div className="flex items-start gap-1 px-4 ">
            <Skeleton className="w-full h-4"></Skeleton>
          </div>
          <div className="flex items-start gap-1 px-4 ">
            <Skeleton className="w-full h-4"></Skeleton>
          </div>
        </div>
      ) : (
        <CalendarDayColumnCurrentEvents date={date} events={events}></CalendarDayColumnCurrentEvents>
      )}
    </div>
  );
}
