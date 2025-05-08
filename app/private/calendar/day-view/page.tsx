import { ClientContainer } from "@/calendar/components/client-container";
import { CalendarDayView } from "@/calendar/components/calendar-day-view";
import { CalendarProvider } from "@/calendar/contexts/calendar-context";

export default async function Page() {
  return <CalendarDayView />;
}
