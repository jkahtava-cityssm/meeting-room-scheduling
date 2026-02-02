"use client";

import { CalendarAllViews } from "@/app/features/calendar/calendar-controller/calendar-all-views";
import { CalendarProvider } from "@/contexts/CalendarProvider";
import { useSession } from "@/contexts/SessionProvider";

import { redirect } from "next/navigation";

export default function Home() {
	const { session, isPending } = useSession();

	if (isPending) {
		return <div>Verifying Access</div>;
	}

	if (!session) {
		//console.log("User Requests No session, redirecting to login");
		redirect("/");
	}

	return (
		<CalendarProvider>
			<CalendarAllViews userId={session?.user.id} />
		</CalendarProvider>
	);
}
