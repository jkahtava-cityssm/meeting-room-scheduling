import { CalendarLoadingPage } from '@/app/(private)/calendar/loading';
import { SharedEventDrawerProvider } from '../../event-drawer/drawer-context';
import { CalendarViewSwitcher, getDefaultView, getViewDate, RequirePermission } from './calendar-all-views';
import { useMemo } from 'react';
import { CALENDAR_VIEWS, TCalendarView } from '@/lib/types';
import { CalendarPermissions } from '../permissions/calendar.permissions';
import { useSearchParams } from 'next/navigation';
import { CalendarHeader } from './calendar-all-header';
import { CalendarProviderPrivate } from '@/contexts/CalendarProviderPrivate';
import { useCalendarSearchParams } from './use-calendar-search-params';

export function CalendarScheduleView() {
  const { isVerifying, can, canAny } = CalendarPermissions.usePermissions();

  const permissions = {
    day: can('ViewCalendarDay'),
    month: can('ViewCalendarMonth'),
    week: can('ViewCalendarWeek'),
    year: can('ViewCalendarYear'),
    agenda: can('ViewCalendarAgenda'),
  };

  const { dateValue, view } = useCalendarSearchParams(permissions);
  const hasAccess = canAny(...Object.values(permissions));

  if (isVerifying) {
    return <CalendarLoadingPage />;
  }

  if (!hasAccess) {
    return <RequirePermission allowed={hasAccess}></RequirePermission>;
  }

  return (
    <CalendarProviderPrivate>
      <SharedEventDrawerProvider>
        <div className="overflow-hidden rounded-xl border min-w-92 flex flex-1 flex-col">
          <CalendarHeader
            view={view as Exclude<TCalendarView, 'all' | 'public'>}
            selectedDate={dateValue}
            permissions={permissions}
            allowCreateEvent={can('CreateEvent')}
          />
          <CalendarViewSwitcher view={view} date={dateValue} permissions={permissions} />
        </div>
      </SharedEventDrawerProvider>
    </CalendarProviderPrivate>
  );
}
