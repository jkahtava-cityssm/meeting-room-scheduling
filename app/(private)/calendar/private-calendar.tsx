'use client';

import { CalendarScheduleView } from '@/app/features/calendar/calendar-controller/calendar-schedule-view';
import { CalendarPermissions } from '@/app/features/calendar/permissions/calendar.permissions';
import { CalendarProviderPrivate } from '@/contexts/CalendarProviderPrivate';

export default function PrivateCalendar() {
  return (
    <CalendarPermissions.Provider>
      <CalendarProviderPrivate>
        <CalendarScheduleView />
      </CalendarProviderPrivate>
    </CalendarPermissions.Provider>
  );
}
