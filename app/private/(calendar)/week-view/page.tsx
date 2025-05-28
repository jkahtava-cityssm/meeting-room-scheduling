import { CalendarAllViews } from "@/components/calendar/calendar-all-views";
import { CalendarWeekView } from "@/components/calendar/calendar-week-view";

export default async function Page() {
  return <CalendarAllViews view={"week"} />;
  return <CalendarWeekView />;
}
