import { CalendarLoadingPage } from '@/app/(private)/calendar/loading';
import { useSession } from '@/contexts/SessionProvider';

import { CalendarPermissions } from '../permissions/calendar.permissions';
import { TCalendarView } from '@/lib/types';
import { CalendarViewSwitcher, RequirePermission } from './calendar-all-views';

import { SharedEventDrawerProvider } from '../../event-drawer/drawer-context';
import { CalendarHeader } from './calendar-all-header';
import { CalendarProviderPrivate } from '@/contexts/CalendarProviderPrivate';
import { useCalendarSearchParams } from './use-calendar-search-params';

export function CalendarPersonalView() {
  const { session } = useSession();

  const userId = session?.user.id;

  const { isVerifying, can, canAny } = CalendarPermissions.usePermissions();

  const permissions = {
    day: can('ViewMyBookingDay'),
    month: can('ViewMyBookingMonth'),
    week: can('ViewMyBookingWeek'),
    year: can('ViewMyBookingYear'),
    agenda: can('ViewMyBookingAgenda'),
  };

  const { dateValue, view } = useCalendarSearchParams(permissions);
  const hasAccess = canAny(...Object.values(permissions));

  if (isVerifying || !session || !userId) {
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
            userId={userId}
            permissions={permissions}
            allowCreateEvent={can('CreateEvent')}
          />
          <CalendarViewSwitcher view={view} date={dateValue} permissions={permissions} userId={userId} />
        </div>
      </SharedEventDrawerProvider>
    </CalendarProviderPrivate>
  );
}
