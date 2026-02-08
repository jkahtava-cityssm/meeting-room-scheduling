"use client";

import { startOfDay, endOfDay, format, isToday } from "date-fns";
import { usePrivateCalendar } from "@/contexts/CalendarProviderPrivate";

import { useEffect, useMemo, useRef, useState } from "react";

import { CalendarDayViewSkeleton } from "./skeleton-calendar-day-view";
import { IEvent } from "@/lib/schemas/calendar";
import { TVisibleHours } from "@/lib/types";

import { useEventsQuery } from "@/lib/services/events";
import { DailyTimeBlocks } from "@/app/features/calendar/calendar-day-grid/calendar-day-grid";
import { CalendarDayGridProvider } from "@/app/features/calendar/calendar-day-grid/calendar-day-grid-context";
import { DayViewDayHeader } from "./calendar-day-view-day-header";
import { useCalendarDayGrid } from "@/app/features/calendar/calendar-day-grid/use-calendar-day-grid";
import { IDayGrid } from "@/app/features/calendar/calendar-day-grid/calendar-day-grid-webworker";
import { cn } from "@/lib/utils";
import { CalendarDayColumnCalendar } from "../sidebar-day-picker/calendar-day-column-calendar";
import { CalendarPermissions } from "../permissions/calendar.permissions";
import { usePrivateCalendarEvents } from "../webworkers/use-calendar-private-events";
import { CalendarScrollContainerPrivate } from "../components/calendar-scroll-container";
import { CalendarScrollColumnPrivate } from "../components/calendar-scroll-column";
import { CalendarWeekViewSkeleton } from "../view-week/skeleton-calendar-week-view";

export interface IDayProcessData {
	events: IEvent[];
	selectedDate: Date;
	selectedRoomId: string;
	pixelHeight: number;
	visibleHours: TVisibleHours;
	multiDayEventsAtTop: boolean;
}

export interface IDayResponseData {
	totalEvents: number;
	dayViews: IDayView[];
	hours: number[];
	filteredEvents: IEvent[];
	roomIds: number[];
}

export interface IDayView {
	day: number;
	dayDate: Date;
	isToday: boolean;
	eventBlocks: IEventBlock[];
}

export interface IEventBlock {
	groupIndex: number;
	eventIndex: number;
	eventStyle: { top: string; width: string; left: string };
	eventHeight: number;
	event: IEvent;
	roomId: number;
}

export function CalendarDayView({ date, userId, isSidebarOpen = false }: { date: Date; userId?: string; isSidebarOpen?: boolean }) {
	const { permissions, isVerifying } = CalendarPermissions.usePermissions();
	const { interval, visibleHours, defaultHours, visibleRooms, selectedRoomId, setIsHeaderLoading, setTotalEvents } = usePrivateCalendar();

	const roomIds = useMemo(() => (visibleRooms ? visibleRooms.map(room => room.roomId.toString()) : []), [visibleRooms]);

	const { result, isLoading } = usePrivateCalendarEvents("DAY", date, visibleHours, userId, roomIds);

	useEffect(() => {
		if (isLoading) {
			setIsHeaderLoading(true);
		}

		if (result && !isLoading) {
			setIsHeaderLoading(false);
		}
	}, [isLoading, result, setIsHeaderLoading, setTotalEvents]);

	const { roomsToRender, events } = useMemo(() => {
		const rooms =
			visibleRooms
				?.filter(room => selectedRoomId === "-1" || String(room.roomId) === selectedRoomId)
				.map(room => {
					const blocks = result?.data.roomBlocks?.get(String(room.roomId)) ?? [];
					return { roomId: room.roomId, roomName: room.name, blocks };
				}) ?? []; // Flatten all events from all blocks
		const events = rooms.flatMap(
			room => room.blocks.map(block => block.event).filter(Boolean), // remove null/undefined
		);

		return { roomsToRender: rooms, events };
	}, [visibleRooms, selectedRoomId, result]);

	useEffect(() => {
		setTotalEvents(events.length);
	}, [events, setTotalEvents]);

	const lastRoomId = roomsToRender?.length ? roomsToRender[roomsToRender.length - 1].roomId : undefined;

	const isMounting = !visibleRooms || !result;

	return (
		<div className="flex flex-1 min-h-0">
			<div className={cn("flex flex-col min-h-0  min-w-0 transition-[width] duration-600 ease-in-out flex-1")}>
				<DayViewDayHeader currentDate={date} />
				<CalendarScrollContainerPrivate
					isLoading={isLoading}
					hours={result?.data.hours || defaultHours}
					isMounting={isMounting}
					skeleton={<CalendarWeekViewSkeleton />}
				>
					{roomsToRender?.map(room => {
						return (
							<CalendarScrollColumnPrivate
								key={room.roomId}
								loadingBlocks={isLoading}
								title={room.roomName}
								interval={interval}
								roomId={room.roomId}
								userId={userId}
								hours={result?.data.hours || []}
								eventBlocks={room.blocks || []}
								isLastColumn={room.roomId === lastRoomId}
								currentDate={date}
							/>
						);
					})}
				</CalendarScrollContainerPrivate>
			</div>
			<CalendarDayColumnCalendar
				date={date}
				isLoading={isLoading}
				events={events || []}
				view={"day"}
			></CalendarDayColumnCalendar>
		</div>
	);
}
