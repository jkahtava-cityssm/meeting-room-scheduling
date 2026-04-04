import { BadgeColored } from "@/components/ui/badge-colored";
import { Button } from "@/components/ui/button";
import { ButtonColored } from "@/components/ui/button-colored";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { IEventSingleRoom } from "@/lib/schemas";
import { CalendarRange, CalendarSync, ChevronRight, CirclePlus, Clock, Hourglass, MapPin, Save, Send, SendHorizonal, Text } from "lucide-react";

import { TColors } from "@/lib/types";
import { IconColored } from "@/components/ui/icon-colored";
import DynamicIcon, { IconName } from "@/components/ui/icon-dynamic";
import { useSharedEventDrawer } from "../../event-drawer/drawer-context";

import { format } from "date-fns";
import { getDurationText } from "@/lib/helpers";
import { CalendarPermissions } from "../permissions/calendar.permissions";

export default function EventCard({
	event,
	OnApprove,
	OnDeny,
	OnPending,
}: {
	event: IEventSingleRoom;
	OnApprove: () => void;
	OnDeny: () => void;
	OnPending: () => void;
}) {
	const { can } = CalendarPermissions.usePermissions();

	const { openEventDrawer } = useSharedEventDrawer();

	const canReadEvent = can("ReadAllEvent");

	return (
		<Card className="w-100 p-2">
			<CardHeader className="min-w-0 overflow-hidden">
				<CardTitle className="pb-2 mb-1 border-b">
					<div className="flex flex-row w-full justify-between items-center">
						<span className="truncate">{event.title}</span>
						<BadgeColored
							color={event.roomColor as TColors}
							className="shrink-0 max-w-[120px]"
						>
							<span className="truncate block">{event.roomName}</span>
						</BadgeColored>
					</div>

					<div className="flex flex-col">
						<div className="mt-2 flex items-center gap-1">
							<SendHorizonal className="size-5 shrink-0 text-muted-foreground" />
							<p className="text-xs text-foreground font-medium pl-1">{format(event.createdAt, "PPP @ p")}</p>
						</div>
					</div>
				</CardTitle>
				<CardTitle className="flex flex-row w-full justify-between items-center">
					{event.title}

					<BadgeColored
						color={event.status.color as TColors}
						className="h-6"
					>
						<DynamicIcon
							hideBackground={true}
							color={event.status.color as TColors}
							name={event.status.icon as IconName}
							className={"h-4 w-4"}
						></DynamicIcon>
						{event.status.name}
					</BadgeColored>
				</CardTitle>

				<CardDescription className="grid min-w-0 w-full">
					<div className="flex flex-col gap-1 min-w-0">
						<div className="mt-1 flex items-center gap-1 w-full min-w-0">
							<MapPin className="size-5 shrink-0" />
							<div className="min-w-0 flex-1">
								{event.multiRoom ? (
									<div className="columns-2 gap-4 text-xs text-foreground font-medium border-b pb-1 mb-1 pl-1">
										{event.roomName.split(", ").map((room, index) => (
											<p
												key={index}
												className="break-inside-avoid mb-1 truncate"
											>
												{room}
											</p>
										))}
									</div>
								) : (
									<p className="text-xs text-foreground font-medium pl-1 truncate">{event.roomName}</p>
								)}
							</div>
						</div>

						<div className="flex items-center gap-1">
							<CalendarRange className="size-5 shrink-0" />
							<p className="text-xs text-foreground font-medium pl-1">{formatDateRange(event)} </p>
						</div>
						<div className="flex items-center gap-1">
							<Clock className="size-5 shrink-0" />
							<p className="text-xs text-foreground font-medium pl-1">{formatTimeRange(event)}</p>
						</div>
						<div className="flex items-center gap-1">
							<Hourglass className="size-5 shrink-0" />
							<p className="text-xs text-foreground font-medium pl-1">{getDurationText(event.startDate, event.endDate)}</p>
						</div>
						{event.recurrence && (
							<div className="flex items-center gap-1">
								<CalendarSync className="size-5 shrink-0" />
								<p className="text-xs text-foreground font-medium pl-1">{event.recurrence.description}</p>
							</div>
						)}
					</div>
				</CardDescription>
			</CardHeader>
			<CardContent>
				<div className="flex flex-col gap-1">
					<div className="flex items-center gap-2 mb-2">
						<Text className="size-5 shrink-0 text-muted-foreground " />
						<div>
							<p className="text-xs text-foreground font-medium">Details</p>
						</div>
					</div>
					<div className="flex items-center gap-2 pl-7 ">
						<p className="text-xs text-foreground line-clamp-6 min-h-24">{event.description}</p>
					</div>
				</div>
			</CardContent>
			<CardFooter className="flex flex-col-reverse sm:flex-row gap-2 mt-auto">
				{event.status.name !== "Confirmed" && (
					<ButtonColored
						color="green"
						className="w-full sm:w-1/3"
						onClick={OnApprove}
					>
						Confirm
					</ButtonColored>
				)}
				{event.status.name !== "Rejected" && (
					<ButtonColored
						color="red"
						className="w-full sm:w-1/3"
						onClick={OnDeny}
					>
						Reject
					</ButtonColored>
				)}
				{event.status.name !== "Pending Review" && (
					<ButtonColored
						color="slate"
						className="w-full sm:w-1/3"
						onClick={OnPending}
					>
						Pending
					</ButtonColored>
				)}

				<Button
					variant={"outline"}
					className="w-full sm:w-1/3"
					onClick={e => {
						e.preventDefault();
						if (canReadEvent) {
							openEventDrawer({ creationDate: new Date(event.startDate), event: event });
						}
					}}
				>
					Review
				</Button>
			</CardFooter>
		</Card>
	);
}

function formatDateRange(event: IEventSingleRoom) {
	if (event.recurrence && event.recurrence.startDate && event.recurrence.endDate) {
		return `${format(event.recurrence.startDate, "PPP")} - ${format(event.recurrence.endDate, "PPP")}`;
	} else if (event.multiRoom) {
		return format(event.startDate, "PP @ p");
	} else {
		format(event.startDate, "PPP");
	}
}

function formatTimeRange(event: IEventSingleRoom) {
	if (event.recurrence && event.recurrence.startDate && event.recurrence.endDate) {
		return `${format(event.startDate, "p")} - ${format(event.endDate, "p")}`;
	} else if (event.multiRoom) {
		return format(event.endDate, "PP @ p");
	} else {
		return `${format(event.startDate, "p")} - ${format(event.endDate, "p")}`;
	}
}
