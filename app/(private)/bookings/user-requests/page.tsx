"use client";
import { CalendarDayColumnCalendar } from "@/components/calendar/calendar-day-column-calendar";
import { EventBlock } from "@/components/calendar/calendar-day-event-block";
import { CalendarDayViewSkeleton } from "@/components/calendar/skeleton-calendar-day-view";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useClientSession } from "@/hooks/use-client-auth";
import { IEvent } from "@/lib/schemas/calendar";
import { useEventQuery, useEventsByStatusQuery, useEventsQuery } from "@/services/events";
import { useUserEventsQuery } from "@/services/users";
import { endOfDay, format, startOfDay } from "date-fns";
import { redirect } from "next/navigation";
import { useEffect, useState } from "react";

export default function Home() {
	const isLoading = false;
	const date = new Date();
	const dayViews: { day: string }[] = [{ day: "test" }];

	const { session, isPending } = useClientSession();
	const startDate: Date = startOfDay(date);
	const endDate: Date = endOfDay(date);

	const [filteredEvents, setFilteredEvents] = useState<IEvent[]>([]);
	const { data: events } = useEventsByStatusQuery(startDate, endDate, "1");

	useEffect(() => {
		if (!events) {
			return;
		}

		setFilteredEvents(events);
	}, [events]);

	if (isPending) {
		return <div>Verifying Access</div>;
	}

	if (!session) {
		//console.log("User Requests No session, redirecting to login");
		redirect("/");
	}

	return (
		<>
			<div>THIS WILL BE A VIEW FOR RECEPTION TO APPROVE OR DENY BOOKINGS</div>
			<div className="flex">
				{isLoading ? (
					<CalendarDayViewSkeleton />
				) : (
					<div className="flex flex-1 flex-col">
						<ScrollArea
							className="max-h-[50vh] md:max-h-[60vh] lg:max-h-[70vh] xl:max-h-[73vh]"
							type="always"
						>
							<div className="flex border-l">
								{/* Day grid */}
								<div className="relative flex-1 border-b">
									<div className="relative">
										{filteredEvents &&
											filteredEvents.map((event, index) => {
												return <Card key={index}>LLLL</Card>;
											})}
									</div>
								</div>
							</div>
						</ScrollArea>
					</div>
				)}
				<CalendarDayColumnCalendar
					date={date}
					isLoading={isLoading}
					events={filteredEvents}
					view={"day"}
				></CalendarDayColumnCalendar>
			</div>
		</>
	);
}
