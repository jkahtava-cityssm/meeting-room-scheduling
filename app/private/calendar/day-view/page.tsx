import { ClientContainer } from "@/calendar/components/client-container";
import { CalendarDayView } from "@/calendar/components/week-and-day-view/calendar-day-view";
import { CalendarProvider } from "@/calendar/contexts/calendar-context";

export default async function Page() {
  return <CalendarDayView />;
}
