import { CalendarProvider } from "@/calendar/contexts/calendar-context";
import { IEvent, IRoom } from "@/calendar/interfaces";
import { CALENDAR_EVENTS_MOCK, CALENDAR_ROOMS_MOCK } from "@/calendar/mocks";

export default async function Layout({ children }: { children: React.ReactNode }) {
  return (
    <CalendarProvider events={CALENDAR_EVENTS_MOCK} rooms={CALENDAR_ROOMS_MOCK}>
      {children}
    </CalendarProvider>
  );
}
