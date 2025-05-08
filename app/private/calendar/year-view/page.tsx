import { ClientContainer } from "@/calendar/components/client-container";
import { CalendarHeader } from "@/calendar/components/calendar-all-header";
import { CalendarYearView } from "@/calendar/components/calendar-year-view";
import { LoaderCircleIcon } from "lucide-react";
import { Suspense } from "react";

async function waitFor(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export default function CalendarYear() {
  return <CalendarYearView />;
}
