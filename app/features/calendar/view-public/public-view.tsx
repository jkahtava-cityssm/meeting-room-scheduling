"use client";

import { parse } from "date-fns";

import { useEffect, useMemo } from "react";

import { IEvent } from "@/lib/schemas/calendar";
import { TVisibleHours } from "@/lib/types";
import { PUBLIC_IEVENT, usePublicRoomsQuery } from "@/lib/services/public";
import { useSearchParams } from "next/navigation";

import { DateControls, DateControlSkeleton } from "./public-date-control";
import { RoomCategoryLayout } from "./public-room-filter";

import { Button } from "@/components/ui/button";
import { FilterIcon } from "lucide-react";
import { ButtonGroup, ButtonGroupSeparator } from "@/components/ui/button-group";

import { CalendarScrollContainerPublic } from "../components/calendar-scroll-container";
import { CalendarScrollColumnPublic } from "../components/calendar-scroll-column";
import { CalendarWeekViewSkeleton } from "../view-week/skeleton-calendar-week-view";
import { useRoomFiltering } from "./use-room-filtering";
import { usePublicCalendarEvents } from "../webworkers/use-calendar-public-events";
import { RoomCategorySkeleton } from "./public-room-filter-skeleton";
import { Skeleton } from "@/components/ui/skeleton";
import { usePublicCalendar } from "@/contexts/CalendarProviderPublic";

export interface IPublicProcessData {
	events: PUBLIC_IEVENT[];
	selectedDate: Date;
	roomIdList: string[];
	pixelHeight: number;
	visibleHours: TVisibleHours;
	multiDayEventsAtTop: boolean;
}

export interface IPublicResponseData {
	totalEvents: number;
	dayView: IDayView;
	hours: number[];
	//weekViews: WeekView[];
}

export type IEventList = Map<string, IEventBlock[]>;

export interface IDayView {
	day: number;
	dayDate: Date;
	isToday: boolean;
	eventBlocks: IEventList;
}

export interface IEventBlock {
	key: string;
	groupIndex: number;
	eventIndex: number;
	eventStyle: { top: string; width: string; left: string };
	eventHeight: number;
	event: IEvent;
}

function getViewDate(dateParam: string | null) {
	return dateParam === null ? removeTimeFromDate(new Date()) : parse(dateParam, "yyyy-MM-dd", new Date());
}

function removeTimeFromDate(date: Date) {
	return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export function CalendarPublicView({ sideBarOpen = false }: { sideBarOpen?: boolean }) {
	//console.log(sideBarOpen);
	const searchParams = useSearchParams();
	const dateParam = searchParams.get("selectedDate");

	const dateValue = useMemo(() => {
		return getViewDate(dateParam);
	}, [dateParam]);

	const { interval, visibleRooms, visibleHours, defaultHours, setIsHeaderLoading, setTotalEvents } = usePublicCalendar();

	const { data: rooms } = usePublicRoomsQuery();

	const roomIds = useMemo(() => (rooms ? rooms.map(room => room.roomId.toString()) : []), [rooms]);

	const { result, isLoading } = usePublicCalendarEvents("DAY", dateValue, roomIds, visibleHours);
	//const { result:b, isLoading:d } = usePrivateCalendar("MONTH", dateValue,visibleHours,undefined, roomIds);

	const { checkedRooms, debouncedRooms, toggleRoom, filterByProjector, selectAll } = useRoomFiltering(rooms);

	const filteredRooms = useMemo(() => {
		return rooms?.filter(room => debouncedRooms.includes(room.roomId));
	}, [rooms, debouncedRooms]);

	useEffect(() => {
		if (isLoading) {
			setIsHeaderLoading(true);
		}

		if (result && !isLoading) {
			setIsHeaderLoading(false);
			setTotalEvents(result.totalEvents);
		}
	}, [isLoading, result, setIsHeaderLoading, setTotalEvents]);

	const lastRoomId = filteredRooms?.length ? filteredRooms[filteredRooms.length - 1].roomId : undefined;
	const isMounting = !result || !filteredRooms;
	return (
		<div className="flex flex-col lg:flex-row gap-4 h-full min-h-0 overflow-auto ">
			{/* LEFT CONTAINER */}
			<div className="w-full flex flex-col gap-2 p-4 sm:p-0 lg:w-72 ">
				<div className="flex flex-wrap items-center justify-between py-2">
					{isMounting ? (
						<>
							<Skeleton className="w-10 h-6"></Skeleton>
							<ButtonGroup>
								<Skeleton className="w-41 h-8"></Skeleton>
								<ButtonGroupSeparator />
								<Skeleton className="w-14 h-8"></Skeleton>
							</ButtonGroup>
						</>
					) : (
						<>
							<label className="font-bold">Filter</label>
							<ButtonGroup>
								<Button
									size="sm"
									className="text-xs"
									onClick={filterByProjector}
								>
									<FilterIcon></FilterIcon> Rooms with Projectors
								</Button>
								<ButtonGroupSeparator />
								<Button
									size="sm"
									className="text-xs "
									onClick={selectAll}
								>
									Reset
								</Button>
							</ButtonGroup>
						</>
					)}
				</div>

				<div className="w-full shrink-0 border rounded-lg p-4 lg:w-72 ">
					{isMounting ? (
						<RoomCategorySkeleton />
					) : (
						<RoomCategoryLayout
							checkedRooms={checkedRooms}
							onToggleRoom={toggleRoom}
							rooms={rooms || []}
						></RoomCategoryLayout>
					)}
				</div>
			</div>

			{/* RIGHT CONTAINER */}
			<div className="flex-1 flex flex-col min-w-0 gap-2 min-h-0 ">
				{/* HEADER: Date Nav stacks middle item on top if narrow */}

				{isMounting ? <DateControlSkeleton selectedDate={dateValue} /> : <DateControls selectedDate={dateValue}></DateControls>}
				{/* MAIN PANEL: Grows to take space */}
				<div className="flex border rounded-lg sm:p-4 min-h-125">
					<CalendarScrollContainerPublic
						isLoading={isLoading}
						hours={result?.data.hours || defaultHours}
						isMounting={isMounting || filteredRooms.length === 0}
						skeleton={<CalendarWeekViewSkeleton />}
					>
						{filteredRooms?.map(room => {
							//console.log(dayViews?.eventBlocks.get(String(room.roomId)));
							return (
								<CalendarScrollColumnPublic
									key={room.roomId}
									loadingBlocks={isLoading}
									title={room.name}
									interval={interval}
									roomId={room.roomId}
									userId={undefined}
									hours={result?.data.hours || []}
									eventBlocks={result?.data.roomBlocks.get(String(room.roomId)) || []}
									isLastColumn={room.roomId === lastRoomId}
									currentDate={dateValue}
								/>
							);
						})}
					</CalendarScrollContainerPublic>
				</div>
			</div>
		</div>
	);
}
