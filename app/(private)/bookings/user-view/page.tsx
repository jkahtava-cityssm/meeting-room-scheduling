"use client";

import { CalendarAllViews } from "@/app/features/calendar/calendar-controller/calendar-all-views";
import { CalendarPermissions } from "@/app/features/calendar/permissions/calendar.permissions";
import { CalendarProviderPrivate } from "@/contexts/CalendarProviderPrivate";
import { useSession } from "@/contexts/SessionProvider";

import { redirect } from "next/navigation";

export default function Home() {
	return (
		<CalendarPermissions.Provider>
			<CalendarProviderPrivate>
				<CalendarAllViews limitedByUserId={true} />
			</CalendarProviderPrivate>
		</CalendarPermissions.Provider>
	);
}
