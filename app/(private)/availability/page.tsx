"use client";

import { CalendarPublicView } from "@/components/calendar/calendar-public-view";
import { useSidebar } from "@/components/ui/sidebar";
import { CalendarProvider } from "@/contexts/CalendarProvider";
import { Suspense } from "react";

export default function Availability() {
  const { open } = useSidebar();
  return (
    <div className="flex flex-1 flex-col gap-4 p-4">
      <CalendarProvider>
        <CalendarPublicView sideBarOpen={open}></CalendarPublicView>
      </CalendarProvider>
    </div>
  );
}
