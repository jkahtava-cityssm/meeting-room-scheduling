"use client";

import { parse } from "date-fns";

import { useEffect, useMemo } from "react";

import { useSearchParams } from "next/navigation";

import { DateControls, DateControlSkeleton } from "./public-date-control";
import { RoomCategoryLayout } from "./public-room-filter";

import { Button } from "@/components/ui/button";
import { FilterIcon, LucideCalendarDays, LucideDoorClosedLocked, LucideDoorOpen } from "lucide-react";
import { ButtonGroup, ButtonGroupSeparator } from "@/components/ui/button-group";

import { CalendarScrollContainerPublic } from "../components/calendar-scroll-container";
import { CalendarScrollColumnPublic } from "../components/calendar-scroll-column";
import { useRoomFiltering } from "./use-room-filtering";
import { usePublicCalendarEvents } from "../webworkers/use-calendar-public-events";
import { RoomCategorySkeleton } from "./public-room-filter-skeleton";
import { Skeleton } from "@/components/ui/skeleton";
import { usePublicCalendar } from "@/contexts/CalendarProviderPublic";
import { CalendarContainerSkeleton } from "../components/calendar-scroll-container-skeleton";
import { GenericError } from "../../../../components/shared/generic-error";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";

function getViewDate(dateParam: string | null) {
	return dateParam === null ? removeTimeFromDate(new Date()) : parse(dateParam, "yyyy-MM-dd", new Date());
}

function removeTimeFromDate(date: Date) {
	return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export function CalendarPublicView() {
	const searchParams = useSearchParams();
	const dateParam = searchParams.get("selectedDate");

	const dateValue = useMemo(() => {
		return getViewDate(dateParam);
	}, [dateParam]);

	const { interval, visibleRooms, visibleHours, fallbackHours, configurationError, roomError, isConfigurationPending, isRoomsPending } =
		usePublicCalendar();

	const roomIds = useMemo(() => (visibleRooms ? visibleRooms.map(room => room.roomId.toString()) : []), [visibleRooms]);

	const { result, isLoading: isEventsLoading, error: eventError } = usePublicCalendarEvents("DAY", dateValue, roomIds, visibleHours);

	const { checkedRooms, debouncedRooms, toggleRoom, filterByProjector, selectAll } = useRoomFiltering(visibleRooms);

	const filteredRooms = useMemo(() => {
		return visibleRooms?.filter(room => debouncedRooms.includes(room.roomId));
	}, [visibleRooms, debouncedRooms]);

	const isMounting = isConfigurationPending || isRoomsPending;

	const noRoomData = visibleRooms?.length === 0;
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

				<div className="flex flex-col w-full shrink border rounded-lg p-4 lg:w-72 overflow-hidden h-full">
					{noRoomData ? (
						<Empty className="border border-dashed min-h-full">
							<EmptyHeader>
								<EmptyMedia>
									<LucideDoorOpen />
								</EmptyMedia>
								<EmptyTitle>No Rooms Found</EmptyTitle>
								<EmptyDescription>Please create a room and mark it as Public</EmptyDescription>
							</EmptyHeader>
							<EmptyContent>{roomError && <GenericError error={roomError} />}</EmptyContent>
						</Empty>
					) : isMounting ? (
						<RoomCategorySkeleton />
					) : (
						<ScrollArea
							className="w-full flex-1 min-h-0"
							type="always"
						>
							<RoomCategoryLayout
								checkedRooms={checkedRooms}
								onToggleRoom={toggleRoom}
								rooms={visibleRooms || []}
							></RoomCategoryLayout>
						</ScrollArea>
					)}
				</div>
			</div>

			{/* RIGHT CONTAINER */}
			<div className="flex-1 flex flex-col min-w-0 gap-2 min-h-0 ">
				{/* HEADER: Date Nav stacks middle item on top if narrow */}

				{isMounting ? <DateControlSkeleton selectedDate={dateValue} /> : <DateControls selectedDate={dateValue}></DateControls>}
				{/* MAIN PANEL: Grows to take space */}

				{noRoomData || configurationError || eventError ? (
					<div className="flex flex-1 flex-col border rounded-lg p-4">
						<Empty className="border border-dashed flex flex-1 flex-col">
							<EmptyHeader>
								<EmptyMedia>
									<LucideCalendarDays />
								</EmptyMedia>
								<EmptyTitle>No Availability Calendar</EmptyTitle>
								<EmptyDescription>
									{eventError
										? eventError.message
										: configurationError
											? configurationError.message
											: noRoomData
												? "No Rooms Found"
												: "Unknown Cause"}
								</EmptyDescription>
							</EmptyHeader>
							<EmptyContent>{roomError && <GenericError error={roomError} />}</EmptyContent>
						</Empty>
					</div>
				) : isMounting ? (
					<div className="flex border rounded-lg sm:p-4 min-h-125">
						<CalendarContainerSkeleton
							hours={fallbackHours}
							totalColumns={15}
						/>
					</div>
				) : (
					<div className="flex border rounded-lg sm:p-4 min-h-125">
						<CalendarScrollContainerPublic
							isLoading={isEventsLoading}
							isEmpty={filteredRooms?.length === 0}
							hours={result?.data.hours || fallbackHours}
						>
							{filteredRooms?.map((room, index) => {
								return (
									<CalendarScrollColumnPublic
										key={room.roomId}
										loadingBlocks={isEventsLoading}
										title={room.name}
										interval={interval}
										roomId={room.roomId}
										userId={undefined}
										hours={result?.data.hours || []}
										eventBlocks={result?.data.roomBlocks[String(room.roomId)] || []}
										isLastColumn={filteredRooms.length - 1 === index}
										currentDate={dateValue}
									/>
								);
							})}
						</CalendarScrollContainerPublic>
					</div>
				)}
			</div>
		</div>
	);
}
