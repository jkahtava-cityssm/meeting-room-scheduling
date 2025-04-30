import { CalendarProvider } from "@/calendar/contexts/calendar-context";
import { IEvent, IRoom } from "@/calendar/interfaces";
import { CALENDAR_EVENTS_MOCK, CALENDAR_ROOMS_MOCK } from "@/calendar/mocks";
import { getEvents, getRooms } from "@/calendar/requests";
import { Suspense } from "react";

export default async function Layout({ children }: { children: React.ReactNode }) {
  const [events, rooms] = await Promise.all([getEvents(), getRooms()]);
  return (
    <CalendarProvider events={events} rooms={rooms}>
      {children}
    </CalendarProvider>
  );
}
