"use client";

import { useEffect, useRef, useState } from "react";

import { usePrivateCalendar } from "@/contexts/CalendarProviderPrivate";

import { MonthViewDayCellSkeleton } from "./skeleton-calendar-month-day-cell";
import { IEvent } from "@/lib/schemas/calendar";

import { MonthViewDayEvents } from "./calendar-month-view-day-events";
import { MonthViewDayHeader } from "./calendar-month-view-day-header";
import { cn } from "@/lib/utils";
import { MonthViewDayFooter } from "./calendar-month-view-day-footer";
import { getDaysInView } from "@/lib/helpers";
import { useEventsQuery } from "@/lib/services/events";
import { TVisibleHours } from "@/lib/types";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { usePrivateCalendarEvents } from "../webworkers/use-calendar-private-events";

const WEEK_DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function CalendarMonthView({ date, userId }: { date: Date; userId?: string }) {
	const { visibleHours, selectedRoomId, setTotalEvents, setIsHeaderLoading } = usePrivateCalendar();

	const { result, isLoading } = usePrivateCalendarEvents("MONTH", date, visibleHours, userId, selectedRoomId);

	useEffect(() => {
		if (isLoading) {
			setIsHeaderLoading(true);
		}

		if (result && !isLoading) {
			setIsHeaderLoading(false);
			setTotalEvents(result.totalEvents);
		}
	}, [isLoading, result, setIsHeaderLoading, setTotalEvents]);

	const isMounting = !result || isLoading;
	console.log(result, isLoading, isMounting);
	if (isMounting) {
		return <MonthViewDayCellSkeleton date={date} />;
	}
	return (
		<>
			<div
				className="grid grid-cols-7 border-b"
				//pr-[15px]
			>
				{WEEK_DAYS.map(day => (
					<div
						key={day}
						className={cn("flex items-center justify-center py-2 border-l", day === "Sun" && "border-l-0")}
					>
						<span className="text-xs font-medium text-muted-foreground">{day}</span>
					</div>
				))}
			</div>
			<div>
				{result.data.weekViews.map(week => {
					return (
						<div key={`week-${week.week}`}>
							<div
								className="grid grid-cols-7 overflow-hidden "
								//pr-[15px]
							>
								{week.dayViews.map((day, index) => {
									return (
										<MonthViewDayHeader
											key={`header-${index}`}
											dayRecord={day}
										/>
									);
								})}
							</div>
							<div className="h-18 sm:h-18 lg:h-23 overflow-hidden">
								<ScrollArea
									type="scroll"
									className="h-18.5 sm:h-18.5 lg:h-23.5"
								>
									<div className="grid grid-cols-7 min-h-18.5 sm:min-h-18 lg:min-h-23.5 overflow-hidden ">
										{week.dayViews.map(day => {
											return (
												<MonthViewDayEvents
													key={day.dayDate}
													dayRecord={day}
													userId={userId}
												/>
											);
										})}
									</div>
									<ScrollBar
										orientation="vertical"
										forceMount
									></ScrollBar>
								</ScrollArea>
							</div>
							<div
								className="grid grid-cols-7 overflow-hidden border-b"
								//pr-[15px]
							>
								{week.dayViews.map((day, index) => {
									return (
										<MonthViewDayFooter
											key={`footer-${index}`}
											dayRecord={day}
										/>
									);
								})}
							</div>
						</div>
					);
				})}
			</div>
		</>
	);
}
