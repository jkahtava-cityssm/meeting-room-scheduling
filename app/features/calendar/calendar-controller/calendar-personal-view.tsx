import { CalendarLoadingPage } from '@/app/(private)/calendar/loading';
import { useSession } from '@/contexts/SessionProvider';

import { CalendarPermissions } from '../permissions/calendar.permissions';
import { TCalendarView } from '@/lib/types';
import { CalendarViewSwitcher, RequirePermission } from './calendar-all-views';

import { SharedEventDrawerProvider, useSharedEventDrawer } from '../../event-drawer/drawer-context';
import { CalendarHeader } from './calendar-all-header';
import { CalendarProviderPrivate } from '@/contexts/CalendarProviderPrivate';
import { useCalendarSearchParams } from './use-calendar-search-params';
import { useEventQuery } from '@/lib/services/events';
import { processMultiRoomEvents } from '../webworkers/generic-webworker-utilities';
import { useEffect, useState } from 'react';

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

  const { dateValue, view, eventId } = useCalendarSearchParams(permissions);
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
          <EventFilterTrigger eventId={eventId} userId={userId} />
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

function EventFilterTrigger({ eventId, userId }: { eventId?: number; userId?: string }) {
  const { openEventDrawer } = useSharedEventDrawer();
  const [wasTriggered, setTriggered] = useState(false);

  const { data: event } = useEventQuery(eventId, userId);
  const { canAny } = CalendarPermissions.usePermissions();

  const canReadEvent = canAny('ReadAllEvent', ['ReadSelfEvent', String(event?.userId) === userId]);

  useEffect(() => {
    // Only trigger if we have a valid event fetched and user has permission
    if (eventId && event && canReadEvent && !wasTriggered) {
      const processedEvent = {
        ...event,
        roomId: event.eventRooms[0]?.roomId ?? -2,
        roomColor: event.eventRooms[0]?.color ?? 'zinc',
        roomIcon: event.eventRooms[0]?.icon ?? 'bug',
        roomName: event.eventRooms[0]?.name ?? 'error',
        multiRoom: event.eventRooms.length > 1,
      };

      openEventDrawer({ event: processedEvent, creationDate: new Date(event.startDate) });
      setTriggered(true);
    }
  }, [event, eventId, canReadEvent, openEventDrawer, wasTriggered]);

  return null;
}
