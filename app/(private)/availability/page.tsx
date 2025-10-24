import { CalendarPublicView } from "@/components/calendar/calendar-public-view";
import { CalendarProvider } from "@/contexts/CalendarProvider";

export default async function Home() {
  return (
    <div className="flex flex-1 flex-col gap-4 p-4">
      <CalendarProvider>
        <CalendarPublicView></CalendarPublicView>
      </CalendarProvider>
    </div>
  );
}
