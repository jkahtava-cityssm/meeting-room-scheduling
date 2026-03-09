"use client";
import { BookingPermissions } from "@/app/features/bookings/components/permissions/booking.permissions";
import UserRequests from "@/app/features/bookings/components/user-request";
import { useSession } from "@/contexts/SessionProvider";
import { Suspense } from "react";

export default function Page() {
  const { session } = useSession();
  return (
    <Suspense fallback={<>...Loading</>}>
      <BookingPermissions.Provider session={session}>
        <UserRequests></UserRequests>
      </BookingPermissions.Provider>
    </Suspense>
  );
}
