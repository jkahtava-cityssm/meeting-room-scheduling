import { CalendarDayView } from "@/components/calendar/calendar-day-view";
import { useCalendar } from "@/components/calendar/contexts/calendar-context";
import { getEventsDaily } from "@/services/events";

export default async function Page() {
  return <CalendarDayView />;
}
