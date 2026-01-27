import { CalendarAllViews } from "@/components/calendar/calendar-all-views";
import { CalendarProvider } from "@/contexts/CalendarProvider";

export default async function Calendar() {
	return (
		<CalendarProvider>
			<CalendarAllViews />
		</CalendarProvider>
	);
}
