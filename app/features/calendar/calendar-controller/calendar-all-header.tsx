"use client";
import Link from "next/link";
import { Columns, Grid3x3, List, Plus, Grid2x2, CalendarRange } from "lucide-react";
import { Button } from "@/components/ui/button";
import { RoomSelect } from "@/app/features/rooms/room-select";

import type { TCalendarView } from "@/lib/types";
import { navigateDate, navigateURL } from "@/lib/helpers";
import { usePrivateCalendar } from "@/contexts/CalendarProviderPrivate";
import { useRouter } from "next/navigation";

import { DateNavigator } from "./calendar-all-header-date-navigator";
import { TodayButton } from "./calendar-all-header-today-button";
import { CalendarPermissions } from "../permissions/calendar.permissions";

import EventDrawerRefactor from "../../event-drawer-refactor/event-drawer-root";
import EventDrawer from "../../event-drawer/event-drawer";

export function CalendarHeader({
	view,
	selectedDate,
	userId,
	permissions,
}: {
	view: Exclude<TCalendarView, "all" | "public">;
	selectedDate: Date;
	userId?: string;
	permissions: Record<Exclude<TCalendarView, "all" | "public">, boolean>;
}) {
	const { day, week, month, year, agenda } = permissions;
	//const { session, isPending } = useSession();
	const { can, isVerifying } = CalendarPermissions.usePermissions();
	const { setSelectedRoomId, selectedRoomId } = usePrivateCalendar();
	const { push } = useRouter();

	const handleNavigatePrevious = () => {
		const previousDate = navigateDate(selectedDate, view, "previous");

		push(navigateURL(previousDate, view));
	};

	const handleNavigateNext = () => {
		const nextDate = navigateDate(selectedDate, view, "next");

		push(navigateURL(nextDate, view));
	};

	const handleNavigateRoomChange = (value: string) => {
		setSelectedRoomId(value);
	};

	return (
		<>
			<div className="flex flex-col gap-4 border-b p-4 min-w-90 lg:flex-row lg:items-center lg:justify-between shrink-0">
				<div className="flex items-center gap-3">
					<TodayButton view={view} />

					<DateNavigator
						view={view}
						selectedDate={selectedDate}
						onPreviousClick={handleNavigatePrevious}
						onNextClick={handleNavigateNext}
					/>
				</div>

				<div className="flex flex-col items-center gap-1.5 sm:flex-row sm:justify-between">
					<div className="flex w-full items-center gap-1.5">
						<div className="inline-flex first:rounded-r-none last:rounded-l-none [&:not(:first-child):not(:last-child)]:rounded-none">
							<Button
								asChild={day}
								aria-label="View by day"
								size="icon"
								variant={view === "day" ? "default" : "outline"}
								className="rounded-r-none [&_svg]:size-5"
								disabled={!day}
							>
								<Link href={navigateURL(selectedDate, "day")}>
									<List strokeWidth={1.8} />
								</Link>
							</Button>

							<Button
								asChild={week}
								aria-label="View by week"
								size="icon"
								variant={view === "week" ? "default" : "outline"}
								className="-ml-px rounded-none [&_svg]:size-5"
								disabled={!week}
							>
								<Link href={navigateURL(selectedDate, "week")}>
									<Columns strokeWidth={1.8} />
								</Link>
							</Button>

							<Button
								asChild={month}
								aria-label="View by month"
								size="icon"
								variant={view === "month" ? "default" : "outline"}
								className="-ml-px rounded-none [&_svg]:size-5"
								disabled={!month}
							>
								<Link href={navigateURL(selectedDate, "month")}>
									<Grid2x2 strokeWidth={1.8} />
								</Link>
							</Button>

							<Button
								asChild={year}
								aria-label="View by year"
								size="icon"
								variant={view === "year" ? "default" : "outline"}
								className="-ml-px rounded-none [&_svg]:size-5"
								disabled={!year}
							>
								<Link href={navigateURL(selectedDate, "year")}>
									<Grid3x3 strokeWidth={1.8} />
								</Link>
							</Button>

							<Button
								asChild={agenda}
								aria-label="View by agenda"
								size="icon"
								variant={view === "agenda" ? "default" : "outline"}
								className="-ml-px rounded-l-none [&_svg]:size-5"
								disabled={!agenda}
							>
								<Link href={navigateURL(selectedDate, "agenda")}>
									<CalendarRange strokeWidth={1.8} />
								</Link>
							</Button>
						</div>
					</div>
					<div className="w-full sm:w-auto">
						<RoomSelect
							includeAllOption={true}
							selectedRoomId={selectedRoomId}
							onRoomChange={handleNavigateRoomChange}
						/>
					</div>
					{/*<AddEventDialog>
            <Button className="w-full sm:w-auto">
              <Plus />
              Add Event
            </Button>
          </AddEventDialog>*/}
					{!isVerifying && can("CreateEvent") && (
						<EventDrawerRefactor userId={userId}>
							<Button className="w-full sm:w-auto">
								<Plus />
								Add Event Refactor
							</Button>
						</EventDrawerRefactor>
					)}
					<EventDrawer userId={userId}>
						<Button className="w-full sm:w-auto">
							<Plus />
							Add Event
						</Button>
					</EventDrawer>
				</div>
			</div>
		</>
	);
}
