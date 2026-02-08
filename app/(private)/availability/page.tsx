"use client";

import { CalendarPublicView } from "@/app/features/calendar/view-public/public-view";
import { useSidebar } from "@/components/ui/sidebar";
import { Skeleton } from "@/components/ui/skeleton";
import { CalendarProviderPublic } from "@/contexts/CalendarProviderPublic";
import { LoaderCircle } from "lucide-react";

import { Suspense } from "react";

export default function Availability() {
	return (
		<div className="overflow-hidden min-w-92 flex flex-1 flex-col min-h-0">
			<CalendarProviderPublic>
				<CalendarPublicView></CalendarPublicView>
			</CalendarProviderPublic>
		</div>
	);
}
