import { CALENDAR_VIEWS, TCalendarView } from '@/lib/types';
import { parse } from 'date-fns';
import { useSearchParams } from 'next/navigation';
import { useMemo } from 'react';

function getViewDate(dateParam: string | null) {
  return dateParam === null ? removeTimeFromDate(new Date()) : parse(dateParam, 'yyyy-MM-dd', new Date());
}

function getDefaultView(permissions: Record<string, boolean>): Exclude<TCalendarView, 'all' | 'public'> {
  const priority: Exclude<TCalendarView, 'all' | 'public'>[] = ['day', 'week', 'month', 'year', 'agenda'];

  //get the first valid as default
  return priority.find((view) => permissions[view]) ?? 'day';
}

function removeTimeFromDate(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export function useCalendarSearchParams(permissions: Record<string, boolean>) {
  const searchParams = useSearchParams();
  const dateParam = searchParams.get('selectedDate');
  const viewParam = searchParams.get('view') as Exclude<TCalendarView, 'all' | 'public'>;

  const dateValue = useMemo(() => getViewDate(dateParam), [dateParam]);

  const view = useMemo(() => {
    return viewParam && CALENDAR_VIEWS.filter((v) => v !== 'public' && v !== 'all').includes(viewParam) ? viewParam : getDefaultView(permissions);
  }, [viewParam, permissions]);

  return { dateValue, view };
}
