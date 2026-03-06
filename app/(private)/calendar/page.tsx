"use client";

import { CalendarAllViews } from "@/app/features/calendar/calendar-controller/calendar-all-views";
import { CalendarPermissions } from "@/app/features/calendar/permissions/calendar.permissions";
import { CalendarProviderPrivate } from "@/contexts/CalendarProviderPrivate";
import { useSession } from "@/contexts/SessionProvider";
import { redirect } from "next/navigation";

export default function Calendar() {
  const { session, isPending } = useSession();

  if (isPending) {
    return <div>Verifying Access</div>;
  }

  if (!session) {
    redirect("/");
  }
  return (
    <CalendarPermissions.Provider session={session}>
      <CalendarProviderPrivate>
        <CalendarAllViews />
      </CalendarProviderPrivate>
    </CalendarPermissions.Provider>
  );
}
