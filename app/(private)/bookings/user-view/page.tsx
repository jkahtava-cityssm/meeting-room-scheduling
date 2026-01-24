"use client";
import { CalendarAllViews } from "@/components/calendar/calendar-all-views";

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
		<div className="h-[calc(100vh-var(--header-height)-1px-32px)]">
			<CalendarAllViews userId={session?.user.id} />
		</div>
	);
}
