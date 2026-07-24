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
import { useEffect, useMemo, useState } from 'react';

export function CalendarPersonalView() {
  const { session } = useSession();

  const userId = session?.user.id;

  const { isVerifying, can, canAny } = CalendarPermissions.usePermissions();

  const permissions = useMemo(
    () => ({
      day: can('ViewMyBookingDay'),
      month: can('ViewMyBookingMonth'),
      week: can('ViewMyBookingWeek'),
      year: can('ViewMyBookingYear'),
      agenda: can('ViewMyBookingAgenda'),
    }),
    [can],
  );

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
          {eventId && <EventFilterTrigger eventId={eventId} userId={userId} />}
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

function EventFilterTrigger({ eventId, userId }: { eventId: number; userId: string }) {
  const { openEventDrawer } = useSharedEventDrawer();
  const [lastTriggeredId, setLastTriggeredId] = useState<number | null>(null);

  const { data: event, refetch } = useEventQuery(eventId, userId, false);
  const { canAny } = CalendarPermissions.usePermissions();

  const canReadEvent = canAny('ReadAllEvent', ['ReadSelfEvent', String(event?.userId) === userId]);

  useEffect(() => {
    const triggerRefetchAndOpen = async () => {
      try {
        // Rename the destructured data to 'refetchedEvent' to avoid collision
        const { data: refetchedEvent } = await refetch();

        // Fallback to the original event if refetch returned nothing
        const finalEvent = refetchedEvent || event;

        if (!finalEvent) return;

        const processedEvent = {
          ...finalEvent,
          roomId: finalEvent.eventRooms?.[0]?.roomId ?? -2,
          roomColor: finalEvent.eventRooms?.[0]?.color ?? 'zinc',
          roomIcon: finalEvent.eventRooms?.[0]?.icon ?? 'bug',
          roomName: finalEvent.eventRooms?.[0]?.name ?? 'error',
          multiRoom: (finalEvent.eventRooms?.length ?? 0) > 1,
        };

        // Open drawer with fresh data
        openEventDrawer({
          event: processedEvent,
          creationDate: new Date(finalEvent.startDate),
        });

        // Update ID state to lock this effect from running again for this eventId
        setLastTriggeredId(eventId);
      } catch (error) {
        console.error('Failed to refetch event data:', error);
      }
    };
    triggerRefetchAndOpen();
  }, [event, eventId, canReadEvent, openEventDrawer, lastTriggeredId, refetch]);

  return null;
}
