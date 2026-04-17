'use client';

import { CalendarRequestView } from '@/app/features/calendar/calendar-controller/calendar-request-view';
import { CalendarPermissions } from '@/app/features/calendar/permissions/calendar.permissions';

export default function PrivateUserRequests() {
  return (
    <CalendarPermissions.Provider>
      <CalendarRequestView />
    </CalendarPermissions.Provider>
  );
}
