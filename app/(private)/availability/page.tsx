"use client";

import { CalendarPublicView } from "@/app/features/calendar/view-public/public-view";
import { useSidebar } from "@/components/ui/sidebar";
import { CalendarProviderPrivate } from "@/contexts/CalendarProviderPrivate";
import { Suspense } from "react";

export default function Availability() {
	const { open, openMobile, isMobile } = useSidebar();
	return (
		<div className="overflow-hidden min-w-92 flex flex-1 flex-col min-h-0">
			<Suspense fallback={<>...Loading</>}>
				<CalendarProviderPrivate>
					<CalendarPublicView sideBarOpen={open && !isMobile}></CalendarPublicView>
				</CalendarProviderPrivate>
			</Suspense>
		</div>
	);
}
