'use client';

import { CalendarPersonalView } from '@/app/features/calendar/calendar-controller/calendar-personal-view';
import { CalendarPermissions } from '@/app/features/calendar/permissions/calendar.permissions';
import { CalendarProviderPrivate } from '@/contexts/CalendarProviderPrivate';

export default function PrivateUserView() {
  return (
    <CalendarPermissions.Provider>
      <CalendarProviderPrivate>
        <CalendarPersonalView />
      </CalendarProviderPrivate>
    </CalendarPermissions.Provider>
  );
}
