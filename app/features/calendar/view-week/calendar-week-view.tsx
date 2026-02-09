"use client";

import { startOfWeek, endOfWeek, format } from "date-fns";
import { usePrivateCalendar } from "@/contexts/CalendarProviderPrivate";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { CalendarTimeline } from "@/app/features/calendar/view-day/calendar-day-timeline";

import { DayHourlyEventDialogs } from "../view-day/calendar-day-event-block-add-hour-block";
import { HourColumn } from "../view-day/calendar-day-column-hourly";
import { WeekViewDayHeader } from "./calendar-week-view-day-header";
import { EventBlock } from "../view-day/calendar-day-event-block";
import { useEffect, useMemo, useRef, useState } from "react";

import { CalendarWeekViewSkeleton } from "./skeleton-calendar-week-view";
import { IEvent } from "@/lib/schemas/calendar";
import { TIME_BLOCK_SIZE, TVisibleHours } from "@/lib/types";
import { useEventsQuery } from "@/lib/services/events";
import { WeeklyBlocks } from "../calendar-day-grid/calendar-week-grid";
import { CalendarScrollContainerPrivate } from "../components/calendar-scroll-container";
import { CalendarScrollColumnPrivate } from "../components/calendar-scroll-column";
import { CalendarDayViewSkeleton } from "../view-day/skeleton-calendar-day-view";
import { IBlock } from "../calendar-day-grid/calendar-day-grid-webworker";
import { cn } from "@/lib/utils";
import { usePrivateCalendarEvents } from "../webworkers/use-calendar-private-events";
import { IEventBlock } from "../webworkers/generic-webworker";

export function CalendarWeekView({ date, userId }: { date: Date; userId?: string }) {
	const { interval, visibleHours, visibleRooms, selectedRoomId, setIsHeaderLoading, setTotalEvents } = usePrivateCalendar();

	const roomIds = useMemo(() => (visibleRooms ? visibleRooms.map(room => room.roomId.toString()) : []), [visibleRooms]);

	const { result, isLoading } = usePrivateCalendarEvents("WEEK", date, visibleHours, userId, roomIds);

	useEffect(() => {
		if (isLoading) {
			setIsHeaderLoading(true);
		}

		if (result && !isLoading) {
			setIsHeaderLoading(false);
		}
	}, [isLoading, result, setIsHeaderLoading, setTotalEvents]);

	useEffect(() => {
		if (!result) return;

		setTotalEvents(result.totalEvents);
	}, [result, setTotalEvents]);

	//const lastRoomId = roomsToRender?.length ? roomsToRender[roomsToRender.length - 1].roomId : undefined;

	const { daysToRender } = useMemo(() => {
		if (!result?.data || result.action !== "WEEK") {
			return { daysToRender: [] };
		}

		const daysToRender = Array.from(result.data.dayBlocks.entries()).map(([dateKey, roomMap]) => {
			// roomMap is a Map<string, IEventBlock[]>

			let filteredRooms: [string, IEventBlock[]][];

			if (selectedRoomId === "-1") {
				// Only include the "-1" (All Rooms) entry
				const allRoomsEntry = roomMap.get("-1");
				filteredRooms = allRoomsEntry ? [["-1", allRoomsEntry]] : [];
			} else {
				// Only include the selected room
				const roomEntry = roomMap.get(selectedRoomId);
				filteredRooms = roomEntry ? [[selectedRoomId, roomEntry]] : [];
			}

			// Flatten blocks
			const flatBlocks = filteredRooms.flatMap(([_, blocks]) => blocks);

			return {
				date: dateKey,
				blocks: flatBlocks,
			};
		});

		return { daysToRender };
	}, [result, selectedRoomId]);

	const isMounting = !visibleRooms || !result;

	return (
		<>
			<div className="flex flex-1 min-h-0">
				<div className={cn("flex flex-col min-h-0  min-w-0 transition-[width] duration-600 ease-in-out flex-1")}>
					{isLoading ? (
						<CalendarWeekViewSkeleton />
					) : (
						<CalendarScrollContainerPrivate
							isLoading={isLoading}
							hours={result?.data.hours || []}
							isMounting={isMounting}
							skeleton={<CalendarDayViewSkeleton hours={result?.data.hours} />}
						>
							{daysToRender.map((day, dayIndex) => {
								return (
									<CalendarScrollColumnPrivate
										key={day.date}
										loadingBlocks={isLoading}
										title={format(day.date, "EE d")}
										interval={interval}
										roomId={undefined}
										userId={userId}
										hours={result?.data.hours || []}
										eventBlocks={day.blocks || []}
										isLastColumn={daysToRender.length - 1 === dayIndex}
										currentDate={new Date(day.date)}
									/>
								);
							})}
						</CalendarScrollContainerPrivate>
					)}
					{/* 
              <>
                <div className="relative z-20 flex border-b">
                  <div className="w-18"></div>
                  <div className={`grid flex-1 grid-cols-${dayViews.length} divide-x border-l`}>
                    {dayViews.map((day) => {
                      return <WeekViewDayHeader key={day.day} dayView={day} />;
                    })}
                  </div>
                </div>
                <ScrollArea className="max-h-[50vh] md:max-h-[60vh] lg:max-h-[70vh] xl:max-h-[73vh]" type="always">
                  <div className="flex overflow-hidden">
                    
                    <HourColumn hours={hours} />

                    
                    <div className="relative flex-1 border-l">
                      <div className="grid grid-cols-7 divide-x">
                        {dayViews.map((day, dayIndex) => {
                          return (
                            <div key={dayIndex} className="relative">
                              <DayHourlyEventDialogs hours={hours} day={day.dayDate} userId={userId} />

                              {day.eventBlocks.map((block, blockIndex) => {
                                return (
                                  <div
                                    key={`day-${dayIndex}-block-${blockIndex}-event-${block.event.eventId}`}
                                    className="absolute p-1"
                                    style={block.eventStyle}
                                  >
                                    <EventBlock eventBlock={block} heightInPixels={block.eventHeight} userId={userId} />
                                  </div>
                                );
                              })}
                            </div>
                          );
                        })}
                      </div>

                      <CalendarTimeline />
                    </div>
                  </div>
                  <ScrollBar orientation="vertical" forceMount></ScrollBar>
                </ScrollArea>
              </>
              */}
				</div>
			</div>
		</>
	);
}
