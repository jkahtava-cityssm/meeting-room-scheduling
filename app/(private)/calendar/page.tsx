import { CalendarAllViews } from "@/app/features/calendar/calendar-controller/calendar-all-views";
import { CalendarProvider } from "@/contexts/CalendarProvider";

export default async function Calendar() {
  return (
    <CalendarProvider>
      <CalendarAllViews />
    </CalendarProvider>
  );
}
