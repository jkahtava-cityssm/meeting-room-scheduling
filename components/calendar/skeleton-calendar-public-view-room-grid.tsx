"use client";

import { format, formatDate } from "date-fns";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";

import { useMemo, useState } from "react";

import { PUBLIC_IROOM } from "@/services/public";
import { Button } from "../ui/button";

import { PublicEventBlock } from "./calendar-public-view-event-block";
import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { IEventList } from "./calendar-public-view";
import { SingleDayPicker } from "../ui/single-day-picker";
import { navigateDate, navigateURL } from "@/lib/helpers";
import { useRouter } from "next/navigation";
import { Skeleton } from "../ui/skeleton";

const HOURS = 12;
const ROOMS = 12;

export const CalendarPublicViewRoomGridSkeleton = ({
	hourBlocksToCreate = HOURS,
	roomBlocksToCreate = ROOMS,
}: {
	hourBlocksToCreate?: number;
	roomBlocksToCreate?: number;
}) => {
	return (
		<ScrollArea
			className={`w-[calc(100%-10px)] h-[calc(100vh-220px)]`}
			type="always"
		>
			{/* Header Row */}
			<div className="mx-6 mb-6">
				<div className="flex h-[60px] w-full border-y-2 sticky top-0 z-10 bg-background">
					<div className="w-18 border-x-2 flex items-center justify-end pr-2">
						<span className="py-2 text-center text-xs font-medium text-muted-foreground">
							<span className="ml-1 font-semibold text-foreground">Time</span>
						</span>
					</div>
					{[...Array(roomBlocksToCreate).keys()].map((room, index) => (
						<div
							key={room}
							className="w-45 border-r-2 flex items-center justify-center"
						>
							<span className="py-2 text-center text-xs font-medium text-muted-foreground">
								<Skeleton className="w-32 h-6"></Skeleton>
							</span>
						</div>
					))}
				</div>

				{/* Time Rows */}
				<div className="flex">
					<div className="min-w-18 border-x-2 pr-2 border-b-2">
						{[...Array(hourBlocksToCreate).keys()].map((hour, index) => (
							<div
								key={hour}
								className="relative"
								style={{ height: "96px" }}
							>
								<div className={"absolute right-2 flex h-6 items-center " + (index !== 0 ? "-top-3" : "")}>
									<Skeleton className="w-8 h-6"></Skeleton>
								</div>
							</div>
						))}
					</div>

					{/* Room Columns */}
					<div className="flex w-full border-b-2">
						{[...Array(roomBlocksToCreate).keys()].map((room, index) => (
							<div key={room}>
								<div className="w-45 relative border-r border-dashed">
									{[...Array(hourBlocksToCreate).keys()].map((hour, index) => {
										return (
											<div
												key={hour}
												className="relative"
												style={{ height: "96px" }}
											>
												{index !== 0 && <div className="pointer-events-none absolute inset-x-0 top-0 border-b-2" />}
												<div className="absolute inset-x-0 top-0 h-6 cursor-pointer transition-colors hover:bg-accent" />
												<div className="absolute inset-x-0 top-6 h-6 cursor-pointer transition-colors hover:bg-accent" />
												<div className="pointer-events-none absolute inset-x-0 top-1/2 border-b border-dashed" />
												<div className="absolute inset-x-0 top-12 h-6 cursor-pointer transition-colors hover:bg-accent" />
												<div className="absolute inset-x-0 top-[72px] h-6 cursor-pointer transition-colors hover:bg-accent" />
											</div>
										);
									})}
								</div>
							</div>
						))}
					</div>
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
};

const RoomHourBlocks = ({ hourBlocksToCreate }: { hourBlocksToCreate: number[] }) => {
	const hourBlocks = useMemo(() => {
		return hourBlocksToCreate.map((hour, index) => (
			<div
				key={hour}
				className="relative"
				style={{ height: "96px" }}
			>
				{index !== 0 && <div className="pointer-events-none absolute inset-x-0 top-0 border-b-2" />}
				<div className="absolute inset-x-0 top-0 h-6 cursor-pointer transition-colors hover:bg-accent" />
				<div className="absolute inset-x-0 top-6 h-6 cursor-pointer transition-colors hover:bg-accent" />
				<div className="pointer-events-none absolute inset-x-0 top-1/2 border-b border-dashed" />
				<div className="absolute inset-x-0 top-12 h-6 cursor-pointer transition-colors hover:bg-accent" />
				<div className="absolute inset-x-0 top-[72px] h-6 cursor-pointer transition-colors hover:bg-accent" />
			</div>
		));
	}, [hourBlocksToCreate]);

	return <>{hourBlocks}</>;
};

const HourColumn = React.memo(({ hourBlocksToCreate }: { hourBlocksToCreate: number[] }) => {
	return (
		<div className="min-w-18 border-x-2 pr-2 border-b-2">
			{hourBlocksToCreate.map((hour, index) => (
				<div
					key={hour}
					className="relative"
					style={{ height: "96px" }}
				>
					<div className={"absolute right-2 flex h-6 items-center " + (index !== 0 ? "-top-3" : "")}>
						<span className="text-xs text-muted-foreground">{format(new Date().setHours(hour), "hh a")}</span>
					</div>
				</div>
			))}
		</div>
	);
});

HourColumn.displayName = "HourColumn";
