import { ClientContainer } from "@/calendar/components/client-container";
import { CalendarProvider } from "@/calendar/contexts/calendar-context";
import { IEvent, IUser } from "@/calendar/interfaces";

export default function Page() {
  return <ClientContainer view="day" />;
}
