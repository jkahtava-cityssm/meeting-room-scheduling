import { CalendarAllViews } from "@/components/calendar/calendar-all-views";
import { CalendarDayView } from "@/components/calendar/calendar-day-view";

export default async function Page() {
  return <CalendarAllViews view={"day"} />;
  return <CalendarDayView />;
}
