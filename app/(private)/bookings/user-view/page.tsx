"use client";
import { CalendarAllViews } from "@/components/calendar/calendar-all-views";
import { CalendarProvider } from "@/contexts/CalendarProvider";

import { useClientSession } from "@/hooks/use-client-auth";

import { redirect } from "next/navigation";

export default function Home() {
	const { session, isPending } = useClientSession();

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
