"use client";

import { useClientSession } from "@/hooks/use-client-auth";
import { IEvent } from "@/lib/schemas/calendar";

import { useEventsByStatusQuery } from "@/services/events";
import { startOfMonth, endOfMonth } from "date-fns";

import { redirect } from "next/navigation";
import { useEffect, useState } from "react";
import { processBookingRequestEvents } from "@/app/features/bookings/workers/booking-request-webworker";
import RequestHeader from "@/app/features/bookings/components/request-header";
import BookingList from "@/app/features/bookings/components/booking-list";
import { ISection } from "@/app/features/bookings/components/types";

export default function Home() {
  const isLoading = false;
  const date = new Date();

  const { session, isPending } = useClientSession();
  const startDate: Date = startOfMonth(date);
  const endDate: Date = endOfMonth(date);

  const [filteredEvents, setFilteredEvents] = useState<IEvent[]>([]);
  const [sections, setSections] = useState<ISection[]>([]);
  const { data: events } = useEventsByStatusQuery(startDate, endDate, "1");

  const [roomId, setRoomId] = useState<string>("-1");

  useEffect(() => {
    if (!events) {
      return;
    }

    const sorted = events.sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
    setSections(processBookingRequestEvents(events, "-1").sections);
    setFilteredEvents(sorted);
  }, [events]);

  if (isPending) {
    return <div>Verifying Access</div>;
  }

  if (!session) {
    //console.log("User Requests No session, redirecting to login");
    redirect("/");
  }

  const breakpoints = true
    ? "w-(--public-calendar-sidebar-w-min) sm:w-(--public-calendar-sidebar-w-sm) lg:w-(--public-calendar-sidebar-w-lg) xl:w-(--public-calendar-sidebar-w-xl)"
    : "w-(--public-calendar-w-min) sm:w-(--public-calendar-w-sm) lg:w-(--public-calendar-w-lg)";
  const view = "day";

  return (
    <div className="overflow-hidden rounded-xl border min-w-92">
      <RequestHeader
        view={view}
        roomId={roomId}
        OnRoomChange={function (): void {
          throw new Error("Function not implemented.");
        }}
      />
      <BookingList sections={sections} />
    </div>
  );
}
