import { CalendarAgendaView } from "@/components/calendar/calendar-agenda-view";
import { CalendarAllViews } from "@/components/calendar/calendar-all-views";

export default async function Page() {
  return <CalendarAllViews view={"agenda"} />;
  return <CalendarAgendaView />;
}
