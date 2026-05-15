'use client';

import { useEffect } from 'react';

import { usePrivateCalendar } from '@/contexts/CalendarProviderPrivate';
import YearViewMonth from './calendar-year-view-month';

import { YearViewSkeleton } from './skeleton-calendar-year-view';
import { usePrivateCalendarEvents } from '../webworkers/use-calendar-private-events';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { GenericError } from '../../../../components/shared/generic-error';

export function CalendarYearView({ date, userId }: { date: Date; userId?: string }) {
  const { visibleHours, visibleRooms, selectedRoomIds, selectedStatusKeys, setIsHeaderLoading, setTotalEvents } = usePrivateCalendar();

  const { result, isLoading, error } = usePrivateCalendarEvents('YEAR', date, visibleHours, userId, selectedRoomIds, selectedStatusKeys);

  useEffect(() => {
    if (isLoading) {
      setIsHeaderLoading(true);
    }

    if (result && !isLoading) {
      setIsHeaderLoading(false);
    }
  }, [isLoading, result, setIsHeaderLoading, setTotalEvents]);

  useEffect(() => {
    if (!result) return;

    setTotalEvents(result.totalEvents);
  }, [result, setTotalEvents]);

  const isMounting = !visibleRooms || !result;

  if (error) {
    return <GenericError error={error} />;
  }

  if (isMounting) {
    return <YearViewSkeleton date={date}></YearViewSkeleton>;
  }

  return (
    <ScrollArea className="h-full w-full min-h-0 bg-background">
      <div className="p-4">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {result?.data.monthViews.map((month) => {
            return <YearViewMonth userId={userId} key={month.month.toString()} month={month} />;
          })}
        </div>
      </div>
      <ScrollBar orientation="vertical" />
    </ScrollArea>
  );
}
