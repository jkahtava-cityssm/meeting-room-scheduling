"use client";

import { BookingPermissions } from "@/app/features/bookings/components/permissions/booking.permissions";
import UserRequests from "@/app/features/bookings/components/user-request";

export default function PrivateUserRequests() {
  return (
    <BookingPermissions.Provider>
      <UserRequests></UserRequests>
    </BookingPermissions.Provider>
  );
}
