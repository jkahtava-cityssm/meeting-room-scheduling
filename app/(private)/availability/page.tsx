"use client";

import { CalendarPublicView } from "@/components/calendar/calendar-public-view";
import { useSidebar } from "@/components/ui/sidebar";
import { CalendarProvider } from "@/contexts/CalendarProvider";
import { Suspense } from "react";

export default function Availability() {
  const { open, openMobile, isMobile } = useSidebar();
  return (
    <div className="flex flex-1 flex-col ">
      <Suspense fallback={<>...Loading</>}>
        <CalendarProvider>
          <CalendarPublicView sideBarOpen={open && !isMobile}></CalendarPublicView>
        </CalendarProvider>
      </Suspense>
    </div>
  );
}
