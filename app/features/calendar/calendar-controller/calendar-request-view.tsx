import { useSession } from '@/contexts/SessionProvider';
import { CALENDAR_VIEWS, TCalendarView } from '@/lib/types';
import { useSearchParams } from 'next/navigation';
import { CalendarPermissions } from '../permissions/calendar.permissions';
import { getDefaultView, getViewDate, RequirePermission } from './calendar-all-views';
import { useMemo } from 'react';
import { CalendarLoadingPage } from '@/app/(private)/calendar/loading';
import { SharedEventDrawerProvider } from '../../event-drawer/drawer-context';
import { CalendarHeader } from './calendar-all-header';
import { CalendarProviderPrivate } from '@/contexts/CalendarProviderPrivate';
import { useCalendarSearchParams } from './use-calendar-search-params';
import { CalendarUserRequestView } from '../view-requests/user-request';
import { BookingPermissions } from '../../bookings/components/permissions/booking.permissions';
import { CalendarAction } from '../webworkers/generic-webworker';

export function CalendarRequestView() {
  const { isVerifying, can, canAny } = BookingPermissions.usePermissions();

  const permissions = {
    day: can('ViewStaffRequests'),
    month: can('ViewStaffRequests'),
    week: can('ViewStaffRequests'),
    year: can('ViewStaffRequests'),
  };

  const { dateValue, view } = useCalendarSearchParams(permissions);
  const hasAccess = canAny(...Object.values(permissions));

  const VIEW_TO_ACTION_MAP: Record<string, CalendarAction> = {
    day: 'DAY',
    week: 'WEEK',
    month: 'MONTH',
    year: 'YEAR',
  };

  const currentAction = VIEW_TO_ACTION_MAP[view] ?? 'DAY';

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
          <CalendarHeader view={view} selectedDate={dateValue} permissions={permissions} allowCreateEvent={false} />

          <RequirePermission allowed={hasAccess}>
            <CalendarUserRequestView action={currentAction} date={dateValue} />
          </RequirePermission>
        </div>
      </SharedEventDrawerProvider>
    </CalendarProviderPrivate>
  );
}
