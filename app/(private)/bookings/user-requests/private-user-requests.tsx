'use client';

import { BookingPermissions } from '@/app/features/bookings/components/permissions/booking.permissions';
import { CalendarRequestView } from '@/app/features/calendar/calendar-controller/calendar-request-view';

export default function PrivateUserRequests() {
  return (
    <BookingPermissions.Provider>
      <CalendarRequestView />
    </BookingPermissions.Provider>
  );
}
