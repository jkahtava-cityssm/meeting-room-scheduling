"use client";
import { CalendarDayColumnCalendar } from "@/components/calendar/calendar-day-column-calendar";
import { EventBlock } from "@/components/calendar/calendar-day-event-block";
import { CalendarDayViewSkeleton } from "@/components/calendar/skeleton-calendar-day-view";
import { BreakPointText } from "@/components/test/breakpoint";
import { ColorCycler } from "@/components/test/ColourChanger";
import { Badge } from "@/components/ui/badge";
import { BadgeColored } from "@/components/ui/badge-colored";
import { Button } from "@/components/ui/button";
import { ButtonColored } from "@/components/ui/button-colored";
import { Card, CardAction, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useClientSession } from "@/hooks/use-client-auth";
import { IEvent } from "@/lib/schemas/calendar";
import { TColors } from "@/lib/types";
import { useEventQuery, useEventsByStatusQuery, useEventsQuery } from "@/services/events";
import { useUserEventsQuery } from "@/services/users";
import { startOfMonth, endOfMonth, format, isSameDay, differenceInHours, intervalToDuration, formatDuration } from "date-fns";
import { redirect } from "next/navigation";
import { useEffect, useState } from "react";

export default function Home() {
	const isLoading = false;
	const date = new Date();
	const dayViews: { day: string }[] = [{ day: "test" }];

	const { session, isPending } = useClientSession();
	const startDate: Date = startOfMonth(date);
	const endDate: Date = endOfMonth(date);

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

	const breakpoints = true
		? "w-(--public-calendar-sidebar-w-min) sm:w-(--public-calendar-sidebar-w-sm) lg:w-(--public-calendar-sidebar-w-lg) xl:w-(--public-calendar-sidebar-w-xl)"
		: "w-(--public-calendar-w-min) sm:w-(--public-calendar-w-sm) lg:w-(--public-calendar-w-lg)";

	return (
		<>
			<div>THIS WILL BE A VIEW FOR RECEPTION TO APPROVE OR DENY BOOKINGS</div>
			<BreakPointText></BreakPointText>
			<ColorCycler></ColorCycler>
			<div className="flex">
				{isLoading ? (
					<CalendarDayViewSkeleton />
				) : (
					<div className={`flex flex-1 flex-col ${breakpoints}`}>
						<ScrollArea
							className="min-h-[40vh] max-h-[70vh] overflow-y-auto"
							type="always"
						>
							<div className="flex justify-center">
								<div className="flex flex-wrap justify-center gap-4 p-4 border-l border-b  max-w-screen-2xl">
									{filteredEvents?.map((event, index) => {
										const duration = formatDuration(intervalToDuration({ start: new Date(event.startDate), end: new Date(event.endDate) }), {
											format: ["years", "months", "days", "hours", "minutes"],
											delimiter: ", ",
										});

										const title = event.recurrenceId
											? "Recurring Event"
											: !isSameDay(event.endDate, event.startDate)
											? "Multi-Day Event"
											: "Single Day Event";

										const multiDayFormat = {
											LineOne: `${format(event.startDate, "PP @ p")}`,
											LineTwo: `${format(event.endDate, "PP @ p")}`,
											LineThree: `${duration}`,
										};

										const singleDayFormat = {
											LineOne: `${format(event.startDate, "PPP")}`,
											LineTwo: `${format(event.startDate, "p")} to ${format(event.endDate, "p")}`,
											LineThree: `${duration}`,
										};

										const recurringDayFormat = {
											LineOne: `${format(event.startDate, "PPP")}`,
											LineTwo: `${format(event.startDate, "p")} to ${format(event.endDate, "p")}`,
											LineThree: `${duration}`,
										};

										const LineOne = event.recurrenceId
											? recurringDayFormat.LineOne
											: isSameDay(event.endDate, event.startDate)
											? singleDayFormat.LineOne
											: multiDayFormat.LineOne;
										const LineTwo = event.recurrenceId
											? recurringDayFormat.LineTwo
											: isSameDay(event.endDate, event.startDate)
											? singleDayFormat.LineTwo
											: multiDayFormat.LineTwo;
										const LineThree = event.recurrenceId
											? recurringDayFormat.LineThree
											: isSameDay(event.endDate, event.startDate)
											? singleDayFormat.LineThree
											: multiDayFormat.LineThree;

										return (
											<Card
												key={index}
												className="w-100 p-2"
											>
												<CardHeader>
													<CardTitle className="flex flex-row w-full justify-between items-center">
														{title}
														<BadgeColored color={event.room.color as TColors}>{event.room.name}</BadgeColored>
													</CardTitle>

													<CardDescription className="line-clamp-4">{event.description}</CardDescription>
												</CardHeader>
												<CardContent>
													<div>{LineOne}</div>
													<div>{LineTwo}</div>
													<div>{LineThree}</div>
													<div></div>
												</CardContent>
												<CardFooter className="flex flex-col sm:flex-row gap-2">
													<ButtonColored
														color="green"
														className="w-full sm:w-1/3"
													>
														Approve
													</ButtonColored>
													<ButtonColored
														color="red"
														className="w-full sm:w-1/3"
													>
														Deny
													</ButtonColored>
													<Button
														variant={"default"}
														className="w-full sm:w-1/3"
													>
														Review
													</Button>
												</CardFooter>
											</Card>
										);
									})}
								</div>
							</div>
						</ScrollArea>
					</div>
				)}
				{/*
        <CalendarDayColumnCalendar
          date={date}
          isLoading={isLoading}
          events={filteredEvents}
          view={"day"}
        ></CalendarDayColumnCalendar>
		*/}
			</div>
		</>
	);
}
