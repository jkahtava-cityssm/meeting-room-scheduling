'use client';

import { CalendarAllViews } from '@/app/features/calendar/calendar-controller/calendar-all-views';
import { CalendarPermissions } from '@/app/features/calendar/permissions/calendar.permissions';
import { CalendarProviderPrivate } from '@/contexts/CalendarProviderPrivate';

export default function PrivateUserView() {
  return (
    <CalendarPermissions.Provider>
      <CalendarProviderPrivate>
        <CalendarAllViews limitedByUserId={true} />
      </CalendarProviderPrivate>
    </CalendarPermissions.Provider>
  );
}
