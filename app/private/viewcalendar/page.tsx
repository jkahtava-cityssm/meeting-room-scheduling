import AuthProvider from "@/app/component/AuthProvider";
import { ClientContainer } from "@/calendar/components/client-container";
import { CalendarProvider } from "@/calendar/contexts/calendar-context";
import { IEvent, IRoom } from "@/calendar/interfaces";
import { CALENDAR_EVENTS_MOCK, CALENDAR_ROOMS_MOCK } from "@/calendar/mocks";

export default async function Home() {
  return (
    <AuthProvider>
      <CalendarProvider events={CALENDAR_EVENTS_MOCK} rooms={CALENDAR_ROOMS_MOCK}>
        <div>PRIVATE SUBFOLDER</div>
        <ClientContainer view="month" />
      </CalendarProvider>
    </AuthProvider>
  );
}
