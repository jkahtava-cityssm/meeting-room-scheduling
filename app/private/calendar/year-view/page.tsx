import { ClientContainer } from "@/calendar/components/client-container";
import { CalendarHeader } from "@/calendar/components/header/calendar-header";
import { CalendarYearView } from "@/calendar/components/year-view/calendar-year-view";
import { LoaderCircleIcon } from "lucide-react";
import { Suspense } from "react";

async function waitFor(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export default function CalendarYear() {
  return <CalendarYearView />;
}
