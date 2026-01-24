import { IEventBlock } from "@/components/calendar/calendar-week-view";
import { format } from "date-fns";
import React from "react";

import { cn } from "@/lib/utils";
import EventDrawer from "@/app/features/event-drawer/event-drawer";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { IBlock } from "./calendar-day-grid-webworker";
import { IRoom } from "@/lib/schemas/calendar";
import { useRouter } from "next/navigation";
import { navigateURL } from "@/lib/helpers";
import { Button } from "@/components/ui/button";
import { GridEventBlock } from "./calendar-day-grid-event-block";

export const DailyTimeBlocks = React.memo(function DailyTimeBlocks({
	hours,
	currentDate,
	userId,
	selectedRoomId,
	visibleRooms,
	roomBlocks,
	dayIndex,
	interval,
	allowCreateEvent,
}: {
	hours: number[];
	currentDate: Date;
	userId: string | undefined;
	selectedRoomId: number;
	visibleRooms: IRoom[];
	roomBlocks: Map<string, IBlock[]>;
	dayIndex: string;
	interval: number;
	allowCreateEvent: boolean;
}) {
	const roomsToRender = React.useMemo(
		() =>
			visibleRooms
				.filter(room => selectedRoomId === -1 || room.roomId === selectedRoomId)
				.map(room => {
					const blocks = roomBlocks.get(String(room.roomId)) ?? [];
					return { roomId: room.roomId, roomName: room.name, blocks };
				}),
		[visibleRooms, selectedRoomId, roomBlocks],
	);

	const lastRoomId = roomsToRender.length ? roomsToRender[roomsToRender.length - 1].roomId : undefined;

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
							<DayColumn
								key={room.roomId}
								roomId={room.roomId}
								roomName={room.roomName}
								hours={hours}
								currentDate={currentDate}
								userId={userId}
								eventBlocks={room.blocks || []}
								dayIndex={dayIndex}
								interval={interval}
								allowCreateEvent={allowCreateEvent}
								isLastColumn={room.roomId === lastRoomId}
							/>
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
const HourColumn = React.memo(function HourColumn({ hours }: { hours: number[] }) {
	const lastHour = hours[hours.length - 1] + 1;
	return (
		<div className="sticky left-0 z-10 bg-background min-w-18 border-r-2 pr-2 border-b-2">
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

const DayColumn = React.memo(function DayColumn({
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
	eventBlocks: IBlock[];
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
			<TimeBlockTopAnchor showBackground={true}></TimeBlockTopAnchor>
			<div className="relative">
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
							{
								<GridEventBlock
									eventBlock={block}
									heightInPixels={block.eventHeight}
									userId={userId}
								/>
							}
						</div>
					);
				})}
			</div>
			<TimeBlockBottomAnchor showBackground={true}></TimeBlockBottomAnchor>
		</div>
	);
});

const DayColumnHeader = React.memo(function DayColumnHeader({ currentDate }: { currentDate: Date }) {
	const { push } = useRouter();

	const handleClick = () => {
		if (currentDate) push(navigateURL(currentDate, "day"));
	};

	return (
		<Button
			variant={"link"}
			size={"sm"}
			onClick={handleClick}
		>
			<span className="py-2 text-center text-xs font-medium text-muted-foreground">
				{format(currentDate, "EE")} <span className="ml-1 font-semibold text-foreground">{format(currentDate, "d")}</span>
			</span>
		</Button>
	);
});

function TimeBlocks({
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
	const clampedValue = clampToValidInterval(interval);
	const totalSlots = 60 / clampedValue;

	return hours.map((hour, index) => {
		return (
			<div
				key={hour}
				className={cn("relative h-24")}
			>
				{index !== 0 && <div className="pointer-events-none absolute inset-x-0 top-0 border-b-2"></div>}
				{Array.from(Array(totalSlots).keys()).map(currentSlot => {
					const startMinute = currentSlot * clampedValue;
					return (
						<div key={currentSlot}>
							<TimeBlockEventDrawer
								roomId={roomId}
								startMinute={startMinute}
								currentDate={currentDate}
								hour={hour}
								allowCreateEvent={allowCreateEvent}
								totalSlots={totalSlots}
								userId={userId}
								index={currentSlot}
							></TimeBlockEventDrawer>
							{SEPARATIONS[totalSlots]?.includes(currentSlot) && <TimeBlockSeperator></TimeBlockSeperator>}
						</div>
					);
				})}
			</div>
		);
	});
}

const TimeBlockEventDrawer = ({
	currentDate,
	hour,
	startMinute,
	allowCreateEvent,
	userId,
	roomId,
	totalSlots,
	index,
}: {
	currentDate: Date;
	hour: number;
	startMinute: number;
	allowCreateEvent: boolean;
	totalSlots: number;
	userId: string | undefined;
	roomId: number;
	index: number;
}) => {
	return allowCreateEvent ? (
		<EventDrawer
			creationDate={getDateTime(currentDate, hour, startMinute)}
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
//<div className={cn("absolute inset-x-0 cursor-pointer transition-colors hover:bg-accent", height, top)} />

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
	1: ["top-0"],
} as const;

const SEPARATIONS: Record<number, number[]> = {
	12: [4, 6, 8],
	6: [3],
	4: [2],
	3: [-1],
	2: [1],
	1: [-1],
} as const;

const TimeBlockButton = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement> & { totalSlots: number; index: number }>(
	function TimeBlockButton({ totalSlots, index, className, ...props }, ref) {
		const height = HEIGHTS[totalSlots];
		const top = TOPS[totalSlots]?.[index];
		return (
			<div
				ref={ref}
				className={cn("absolute inset-x-0 cursor-pointer transition-colors hover:bg-accent", height, top)}
				{...props}
			/>
		);
	},
);

function TimeBlockSeperator() {
	return <div className="pointer-events-none absolute inset-x-0 top-1/2 border-b border-dashed" />;
}

function getDateTime(date: Date, hour: number, minute: number) {
	const newDate = new Date(date);
	newDate.setHours(hour, minute, 0, 0);
	return newDate;
}

const VALID_INTERVALS = [5, 10, 15, 20, 30, 60] as const;
const MINIMUM_INTERVAL = 5;
const MAXIMUM_INTERVAL = 60;

function clampToValidInterval(interval: number) {
	const bounded = Math.min(Math.max(interval, MINIMUM_INTERVAL), MAXIMUM_INTERVAL);
	return VALID_INTERVALS.reduce((best, v) => (Math.abs(bounded - v) < Math.abs(bounded - best) ? v : best), VALID_INTERVALS[0]);
}
