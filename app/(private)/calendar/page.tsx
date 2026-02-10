import { CalendarAllViews } from "@/app/features/calendar/calendar-controller/calendar-all-views";
import { CalendarProviderPrivate } from "@/contexts/CalendarProviderPrivate";

export default async function Calendar() {
  return (
    <CalendarProviderPrivate>
      <CalendarAllViews />
    </CalendarProviderPrivate>
  );
}
