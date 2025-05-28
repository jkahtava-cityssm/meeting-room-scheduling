import { CalendarAllViews } from "@/components/calendar/calendar-all-views";
import { CalendarMonthView } from "@/components/calendar/calendar-month-view";

export default async function Page() {
  return <CalendarAllViews view={"month"} />;
  return <CalendarMonthView />;
}
