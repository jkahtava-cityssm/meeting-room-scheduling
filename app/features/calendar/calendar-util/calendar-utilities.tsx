import { EventBlock } from "@/components/calendar/calendar-day-event-block";

import { IDayView, IEventBlock } from "@/components/calendar/calendar-week-view";
import { format } from "date-fns";
import React from "react";

import { cn } from "@/lib/utils";
import { isWorkingHour } from "@/lib/helpers";
import { TWorkingHours } from "@/lib/types";
import EventDrawer from "@/app/features/event-drawer/event-drawer";
import { useMemo } from "react";
import { IRoom } from "@/lib/schemas/calendar";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";

const MINIMUM_INTERVAL = 5;
const MAXIMUM_INTERVAL = 60;

export const HeaderTimeBlocks = React.memo(function HeaderTimeBlocks({
	rooms,
	hours,
	currentDate,
	userId,
	eventBlocks,
	dayIndex,
	interval,
	allowCreateEvent,
}: {
	rooms: number[];
	hours: number[];
	currentDate: Date;
	userId: string | undefined;
	eventBlocks: IEventBlock[];
	dayIndex: string;
	interval: number;
	allowCreateEvent: boolean;
}) {
	return <></>;
});

export const DailyTimeBlocks = React.memo(function DailyTimeBlocks({
	rooms,
	hours,
	currentDate,
	userId,
	eventBlocks,
	dayIndex,
	interval,
	allowCreateEvent,
}: {
	rooms: number[];
	hours: number[];
	currentDate: Date;
	userId: string | undefined;
	eventBlocks: IEventBlock[];
	dayIndex: string;
	interval: number;
	allowCreateEvent: boolean;
}) {
	const roomList = rooms && rooms.length > 0 ? rooms : [-1];

	const roomsToRender = roomList.map(roomId => {
		if (roomId === -1) {
			return { roomId: -1, roomName: "No Rooms", roomBlocks: eventBlocks };
		}

		const roomBlocks = eventBlocks.filter(b => String(b.roomId) === String(roomId));
		const roomName = roomBlocks.length > 0 ? roomBlocks[0].event.room.name : "default";
		return { roomId, roomName, roomBlocks };
	});

	const breakpoints = false
		? "w-(--public-calendar-sidebar-w-min) sm:w-(--public-calendar-sidebar-w-sm) lg:w-(--public-calendar-sidebar-w-lg) xl:w-(--public-calendar-sidebar-w-xl)"
		: "w-(--public-calendar-w-min) sm:w-(--public-calendar-w-sm) lg:w-(--public-calendar-w-lg)";
	return (
		<ScrollArea
			className="max-h-[50vh] md:max-h-[60vh] lg:max-h-[70vh] xl:max-h-[73vh] w-full"
			type="always"
		>
			<div className="flex  min-w-0">
				{/* Hours column   h-[500px]  */}
				<HourColumn hours={hours} />
				<div className="flex w-full min-w-0 pr-4">
					{roomsToRender.map(room => {
						return (
							<>
								<DayColumn
									key={room.roomId}
									roomId={room.roomId}
									roomName={room.roomName}
									hours={hours}
									currentDate={currentDate}
									userId={userId}
									eventBlocks={room.roomBlocks}
									dayIndex={dayIndex}
									interval={interval}
									allowCreateEvent={allowCreateEvent}
									isLastColumn={room.roomId === roomList[roomList.length - 1]}
								/>
							</>
						);
					})}
				</div>
			</div>
			<ScrollBar
				orientation="vertical"
				forceMount
			/>
			<ScrollBar
				orientation="horizontal"
				forceMount
			/>
		</ScrollArea>
	);
});

export const HourColumn = React.memo(function HourColumn({ hours }: { hours: number[] }) {
	const lastHour = hours[hours.length - 1] + 1;
	return (
		<div className="sticky left-0 z-10 bg-background min-w-18 border-x-2 pr-2 border-b-2">
			<div className="h-8"></div>
			<TimeBlockTopAnchor></TimeBlockTopAnchor>
			{hours.map((hour, index) => {
				return (
					<div
						key={hour}
						className="relative h-24"
					>
						<div className={"absolute right-2 flex items-center -top-3 h-6"}>
							<span className="text-xs text-muted-foreground">{format(new Date().setHours(hour), "hh a")}</span>
						</div>
					</div>
				);
			})}
			<TimeBlockBottomAnchor title={format(new Date().setHours(lastHour), "hh a")}></TimeBlockBottomAnchor>
		</div>
	);
});

export const DayColumn = React.memo(function DayColumn({
	hours,
	currentDate,
	roomId,
	roomName,
	userId,
	eventBlocks,
	dayIndex,
	interval,
	allowCreateEvent,
	isLastColumn,
}: {
	hours: number[];
	currentDate: Date;
	roomId: number;
	roomName: string;
	userId: string | undefined;
	eventBlocks: IEventBlock[];
	dayIndex: string;
	interval: number;
	allowCreateEvent: boolean;
	isLastColumn: boolean;
}) {
	return (
		<div className={cn("min-w-45 w-full border-b-2", isLastColumn && "border-r-2")}>
			<div className="sticky top-0 z-5 bg-background border-b-2 h-8 flex items-center justify-center">
				<span className="py-2 text-center text-xs font-medium text-muted-foreground">
					<span className="ml-1 font-semibold text-foreground">{roomName}</span>
				</span>
			</div>
			<TimeBlocks
				roomId={roomId}
				hours={hours}
				currentDate={currentDate}
				userId={userId}
				allowCreateEvent={allowCreateEvent}
				interval={interval}
			/>

			{eventBlocks.map((block, blockIndex) => {
				return (
					<div
						key={`day-${dayIndex}-block-${blockIndex}-event-${block.event.eventId}`}
						className="absolute p-1"
						style={block.eventStyle}
					>
						{/*<EventBlock
							eventBlock={block}
							heightInPixels={block.eventHeight}
							userId={userId}
						/>*/}
					</div>
				);
			})}
		</div>
	);
});

export function TimeBlocks({
	roomId,
	hours,
	currentDate,
	userId,
	allowCreateEvent,
	interval = 15,
}: {
	roomId: number;
	hours: number[];
	currentDate: Date;
	userId?: string;
	allowCreateEvent: boolean;
	interval: number;
}) {
	const remainder = interval % MINIMUM_INTERVAL;
	const divisibleValue = remainder === 0 ? interval : interval - remainder;
	const clampLowerBounds = divisibleValue < MINIMUM_INTERVAL ? MINIMUM_INTERVAL : divisibleValue;
	const clampedValue = clampLowerBounds > MAXIMUM_INTERVAL ? MAXIMUM_INTERVAL : clampLowerBounds;

	const totalSlots = 60 / clampedValue;

	return (
		<div>
			<TimeBlockTopAnchor showBackground={true}></TimeBlockTopAnchor>
			{hours.map((hour, index) => {
				return (
					<div
						key={hour}
						className={cn("relative h-24")}
					>
						{index !== 0 && <div className="pointer-events-none absolute inset-x-0 top-0 border-b-2"></div>}
						{Array.from(Array(totalSlots).keys()).map(currentSlot => {
							return (
								<div key={currentSlot}>
									<TimeBlockEventDrawer
										key={currentSlot}
										roomId={roomId}
										minute={clampedValue}
										currentDate={currentDate}
										hour={hour}
										allowCreateEvent={allowCreateEvent}
										totalSlots={totalSlots}
										userId={userId}
										index={currentSlot}
									></TimeBlockEventDrawer>
									{SEPERATIONS[totalSlots]?.includes(currentSlot) && <TimeBlockSeperator></TimeBlockSeperator>}
								</div>
							);
						})}
					</div>
				);
			})}
			<TimeBlockBottomAnchor showBackground={true}></TimeBlockBottomAnchor>
		</div>
	);
}

const TimeBlockEventDrawer = ({
	currentDate,
	hour,
	minute,
	allowCreateEvent,
	userId,
	roomId,
	totalSlots,
	index,
}: {
	currentDate: Date;
	hour: number;
	minute: number;
	allowCreateEvent: boolean;
	totalSlots: number;
	userId: string | undefined;
	roomId: number;
	index: number;
}) => {
	return allowCreateEvent ? (
		<EventDrawer
			creationDate={getDateTime(currentDate, hour, minute)}
			userId={userId}
			roomId={roomId}
		>
			<TimeBlockButton
				totalSlots={totalSlots}
				index={index}
			></TimeBlockButton>
		</EventDrawer>
	) : (
		<TimeBlockButton
			totalSlots={totalSlots}
			index={index}
		></TimeBlockButton>
	);
};

function TimeBlockBottomAnchor({
	title,
	showBackground = false,
	topBorder = false,
	bottomBorder = false,
}: {
	title?: string;
	showBackground?: boolean;
	topBorder?: boolean;
	bottomBorder?: boolean;
}) {
	return (
		<div className={cn("relative h-4 ", showBackground && "bg-(--color-border) ", topBorder && "border-t-2", bottomBorder && "border-b-2")}>
			{title && (
				<div className={"absolute right-2 flex items-center -top-2 h-4"}>
					<span className="text-xs text-muted-foreground">{title}</span>
				</div>
			)}
		</div>
	);
}

function TimeBlockTopAnchor({ showBackground = false }: { title?: string; showBackground?: boolean; topBorder?: boolean; bottomBorder?: boolean }) {
	return <div className={cn("relative h-1.5 ", showBackground && "bg-(--color-border) ")}></div>;
}

const HEIGHTS: Record<number, string> = { 12: "h-2", 6: "h-4", 4: "h-6", 3: "h-8", 2: "h-12" } as const;
const TOPS: Record<number, string[]> = {
	12: ["top-0", "top-2", "top-4", "top-6", "top-8", "top-10", "top-12", "top-14", "top-16", "top-18", "top-20", "top-22"],
	6: ["top-0", "top-4", "top-8", "top-12", "top-16", "top-20"],
	4: ["top-0", "top-6", "top-12", "top-18", "top-22"],
	3: ["top-0", "top-8", "top-16"],
	2: ["top-0", "top-12"],
} as const;

const SEPERATIONS: Record<number, number[]> = {
	12: [4, 6, 8],
	6: [3],
	4: [2],
	3: [-1],
	2: [1],
} as const;

function TimeBlockButton({ totalSlots, index }: { totalSlots: number; index: number }) {
	const height = HEIGHTS[totalSlots];
	const top = TOPS[totalSlots]?.[index];
	//console.log("Total Slots:", totalSlots, "Index:", index);
	//console.log(TOPS, HEIGHTS);
	//console.log("Rendering TimeBlockButton with height:", height, "and top:", top);
	return <div className={cn("absolute inset-x-0 cursor-pointer transition-colors hover:bg-accent", height, top)} />;
}

function TimeBlockSeperator() {
	return <div className="pointer-events-none absolute inset-x-0 top-1/2 border-b border-dashed" />;
}

function getDateTime(date: Date, hour: number, minute: number) {
	const newDate = new Date(date);
	newDate.setHours(hour, minute, 0, 0);
	return newDate;
}
