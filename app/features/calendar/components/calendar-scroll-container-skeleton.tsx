import React from "react";

import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { CalendarHourTimeline } from "./calendar-scroll-hour-timeline";
import { format } from "date-fns";
import { CalendarScrollColumnSkeleton } from "./calendar-scroll-column-skeleton";
import { Skeleton } from "@/components/ui/skeleton";

export function CalendarScrollContainerSkeleton({ hours, totalColumns }: { hours: number[]; totalColumns: number }) {
	return (
		<ScrollArea
			className="w-full flex-1 min-h-0"
			type="always"
			viewportRef={undefined}
		>
			<div className="relative flex min-w-0 w-full">
				<HourColumnSkeleton hours={hours} />

				<div className="flex w-full min-w-0 pr-4">
					{Array.from({ length: totalColumns }, (_, index) => {
						return (
							<CalendarScrollColumnSkeleton
								key={index}
								hours={hours}
								isLastColumn={totalColumns === index}
							></CalendarScrollColumnSkeleton>
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
}

export function CalendarContainerSkeleton({ hours, totalColumns }: { hours: number[]; totalColumns: number }) {
	return (
		<div className="w-full flex-1 min-h-0 overflow-hidden">
			<div className="relative flex min-w-0 w-full">
				<HourColumnSkeleton hours={hours} />

				<div className="flex w-full min-w-0 pr-4">
					{Array.from({ length: totalColumns }, (_, index) => {
						return (
							<CalendarScrollColumnSkeleton
								key={index}
								hours={hours}
								isLastColumn={totalColumns === index}
							></CalendarScrollColumnSkeleton>
						);
					})}
				</div>
			</div>
		</div>
	);
}

function HourColumnSkeleton({ hours }: { hours: number[] }) {
	const lastItem = hours?.at(-1);
	const lastHour = lastItem == null ? 0 : lastItem + 1;

	return (
		<div className="sticky left-0 z-10 bg-background min-w-18 border-r-2 pr-2 border-b-2  shrink-0 pt-8">
			<div className=" pt-1.5">
				<CalendarHourTimeline hours={hours} />
				{hours.map((hour, index) => {
					return (
						<div
							key={hour}
							className="h-24 flex items-start pr-2"
						>
							<Skeleton className="ml-auto -mt-2 h-4 w-8"></Skeleton>
						</div>
					);
				})}
				<div className={"h-4 flex items-start pr-2"}>
					<span className="ml-auto -mt-2 text-xs text-muted-foreground">{format(new Date().setHours(lastHour), "hh a")}</span>
				</div>
			</div>
		</div>
	);
}
