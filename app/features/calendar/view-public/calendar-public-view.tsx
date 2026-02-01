"use client";

import { startOfWeek, endOfWeek, parse, format, addYears, formatDate, endOfDay, startOfDay } from "date-fns";
import { useCalendar } from "@/contexts/CalendarProvider";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { IEvent } from "@/lib/schemas/calendar";
import { TIME_BLOCK_SIZE, TVisibleHours } from "@/lib/types";
import { PUBLIC_IEVENT, usePublicEventsQuery, usePublicRoomsQuery } from "@/lib/services/public";
import { useSearchParams } from "next/navigation";

import { FilteredRoomGrid } from "./calendar-public-view-room-grid";
import { RoomCategoryLayoutSkeleton } from "./skeleton-calendar-public-view-room-list";
import PublicHeader, { DateControls } from "./public-header";
import { RoomCategoryLayout } from "./public-categories";
import { CalendarPublicViewRoomGridSkeleton } from "./skeleton-calendar-public-view-room-grid";
import { Button } from "@/components/ui/button";
import { FilterIcon } from "lucide-react";
import { ButtonGroup, ButtonGroupSeparator } from "@/components/ui/button-group";
import { CalendarDayGridProvider } from "../calendar-day-grid/calendar-day-grid-context";
import { DailyTimeBlocks } from "../calendar-day-grid/calendar-day-grid";
import { CalendarScrollContainer } from "../components/calendar-scroll-container";
import { CalendarDayViewSkeleton } from "../view-day/skeleton-calendar-day-view";
import { CalendarScrollColumn } from "../components/calendar-scroll-column";
import { IBlock } from "../calendar-day-grid/calendar-day-grid-webworker";
import { CalendarPermissions } from "../permissions/calendar.permissions";

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

	const [isLoading, setLoading] = useState(true);
	const [isRefreshed, setRefreshed] = useState(false);
	const [dayViews, setDayViews] = useState<IDayView>();
	const [data, setData] = useState([]);
	const [hours, setHours] = useState<number[] | undefined>(undefined);

	const { interval, visibleRooms, visibleHours, setIsHeaderLoading, setTotalEvents } = useCalendar();

	const workerRef = useRef<Worker | null>(null);

	const startDate: Date = startOfDay(dateValue);
	const endDate: Date = endOfDay(dateValue);

	const { data: events } = usePublicEventsQuery(startDate, endDate);

	const { data: rooms } = usePublicRoomsQuery();

	const [selectedRoomIds, setSelectedRoomIds] = useState<number[]>([]);

	const filteredRooms = useMemo(() => {
		return selectedRoomIds.length > 0 ? rooms?.filter(room => selectedRoomIds.includes(room.roomId)) : undefined;
	}, [rooms, selectedRoomIds]);

	useEffect(() => {
		//The Workerthread needs to be recreated when we navigate back to the page if the params havent changed.
		//nextjs cache's the route so this is my temporary fix
		setRefreshed(true);
	}, []);

	useEffect(() => {
		setLoading(true);
	}, [dateValue]);

	useEffect(() => {
		//This is mostly as an example for myself, technically this processing should likely be done on the server side.
		//But this example will come in handy for other applications

		if (workerRef.current) {
			return;
		}

		const newWorker = new Worker(new URL("../webworkers/calendar-public-webworker.ts", import.meta.url));

		newWorker.onmessage = result => {
			setData(result.data);
			setDayViews(result.data.dayView);
			setHours(result.data.hours);
			//setTotalEvents(result.totalEvents);
			setIsHeaderLoading(false);
			setLoading(false);
		};

		workerRef.current = newWorker;

		return () => {
			if (workerRef.current) {
				workerRef.current.terminate();
				workerRef.current = null;
			}
		};
	}, [dateValue, setIsHeaderLoading, setTotalEvents]);

	useEffect(() => {
		if (!events || !rooms) {
			return;
		}

		if (workerRef.current) {
			const data: IPublicProcessData = {
				events: events,
				visibleHours: visibleHours ? visibleHours : { from: 1, to: 24 },
				selectedDate: dateValue,
				roomIdList: rooms.map(room => room.roomId.toString()),
				multiDayEventsAtTop: true,
				pixelHeight: TIME_BLOCK_SIZE,
			};
			//setLoading(true);
			setIsHeaderLoading(true);

			workerRef.current.postMessage(data);
		}
	}, [events, dateValue, isRefreshed, rooms, setIsHeaderLoading, visibleHours]);

	const handleCheckedRoomsChange = useCallback((checkedIds: number[]) => {
		setSelectedRoomIds(checkedIds);
	}, []);

	const memoizedHours = useMemo(() => hours, [hours]);

	/*if (isLoading || !filteredRooms || !events) {
    return <CalendarWeekViewSkeleton />;
  }

  if (filteredRooms || events) {
    <div>...</div>;
  }
*/
	const lastRoomId = filteredRooms?.length ? filteredRooms[filteredRooms.length - 1].roomId : undefined;
	const isMounting = !dayViews || !hours;
	return (
		<div className="flex flex-col lg:flex-row gap-4 h-full min-h-0">
			{/* LEFT CONTAINER */}
			<div className="w-full flex flex-col gap-2 lg:w-72 ">
				{/* HEADER: Label & Button stack when tight */}
				<div className="flex flex-wrap items-center justify-between">
					<label className="font-bold">Filter</label>
					<ButtonGroup>
						<Button
							size="sm"
							className="text-xs"
							onClick={() => {}}
						>
							<FilterIcon></FilterIcon> Rooms with Projectors
						</Button>
						<ButtonGroupSeparator />
						<Button
							size="sm"
							className="text-xs "
							onClick={() => {}}
						>
							Clear
						</Button>
					</ButtonGroup>
				</div>
				{/* BODY: Checkboxes */}
				<div className="w-full shrink-0 border rounded-lg p-4 lg:w-72 ">
					<RoomCategoryLayout
						onCheckedRoomsChange={handleCheckedRoomsChange}
						rooms={rooms || []}
					></RoomCategoryLayout>
				</div>
			</div>

			{/* RIGHT CONTAINER */}
			<div className="flex-1 flex flex-col min-w-0 gap-2 min-h-0">
				{/* HEADER: Date Nav stacks middle item on top if narrow */}

				<DateControls selectedDate={new Date()}></DateControls>
				{/* MAIN PANEL: Grows to take space */}
				<div className="flex border rounded-lg p-4 min-h-0">
					{isLoading ? (
						<>...loading</>
					) : (
						<CalendarPermissions.Provider session={undefined}>
							<CalendarScrollContainer
								isLoading={isLoading}
								hours={hours || []}
								isMounting={isMounting}
								skeleton={<CalendarDayViewSkeleton hours={hours} />}
							>
								{filteredRooms?.map(room => {
									return (
										<CalendarScrollColumn
											key={room.roomId}
											loadingBlocks={true}
											title={room.name}
											interval={interval}
											roomId={room.roomId}
											userId={undefined}
											hours={hours || []}
											eventBlocks={(dayViews?.eventBlocks as unknown as IBlock[]) || []}
											isLastColumn={room.roomId === lastRoomId}
											currentDate={dateValue}
										/>
									);
								})}
							</CalendarScrollContainer>
						</CalendarPermissions.Provider>
					)}
				</div>
			</div>
		</div>
	);

	return (
		<div className={`flex flex-col sm:flex-row gap-2`}>
			<PublicHeader
				selectedDate={new Date()}
				isMounting={false}
				filterRoom={function (): void {
					throw new Error("Function not implemented.");
				}}
				leftContent={<RoomCategoryLayout rooms={rooms || []}></RoomCategoryLayout>}
				rightContent={<CalendarPublicViewRoomGridSkeleton></CalendarPublicViewRoomGridSkeleton>}
			></PublicHeader>
		</div>
	);

	return (
		<>
			<div className={`flex flex-col sm:flex-row gap-2`}>
				{rooms ? (
					<RoomCategoryLayout
						rooms={rooms || []}
						onCheckedRoomsChange={handleCheckedRoomsChange}
						isSidebarOpen={sideBarOpen}
					/>
				) : (
					<RoomCategoryLayoutSkeleton></RoomCategoryLayoutSkeleton>
				)}

				<FilteredRoomGrid
					isLoading={isLoading}
					filteredRooms={filteredRooms}
					hours={memoizedHours}
					eventBlocks={dayViews?.eventBlocks}
					selectedDate={dateValue}
					isSidebarOpen={sideBarOpen}
				/>
			</div>
		</>
	);
}
