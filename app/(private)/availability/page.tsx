"use client";

import { CalendarPublicView } from "@/app/features/calendar/view-public/calendar-public-view";
import { useSidebar } from "@/components/ui/sidebar";
import { CalendarProvider } from "@/contexts/CalendarProvider";
import { Suspense } from "react";

export default function Availability() {
  const { open, openMobile, isMobile } = useSidebar();
  return (
		<div className="overflow-hidden min-w-92 flex flex-1 flex-col min-h-0">
			<Suspense fallback={<>...Loading</>}>
				<CalendarProvider>
					<CalendarPublicView sideBarOpen={open && !isMobile}></CalendarPublicView>
				</CalendarProvider>
			</Suspense>
		</div>
	);
}
