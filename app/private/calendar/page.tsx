import { CalendarProvider } from "@/calendar/contexts/calendar-context";
import { CALENDAR_EVENTS_MOCK, CALENDAR_ROOMS_MOCK } from "@/calendar/mocks";

async function waitFor(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export default async function Calendars({ children }: { children: React.ReactNode }) {
  console.log("TTTT");
  return <>{children}</>;
}
