import { DateNavigator } from "@/components/calendar/calendar-all-header-date-navigator";
import { RoomSelect } from "@/components/calendar/calendar-all-header-room-select";
import { StatusSelect } from "@/components/calendar/calendar-all-header-status-select";
import { TodayButton } from "@/components/calendar/calendar-all-header-today-button";
import { Button } from "@/components/ui/button";
import { Calendar, CalendarRange, Columns, Grid2x2, Grid3x3 } from "lucide-react";
import Link from "next/link";
import { RequestNavigator } from "./request-navigator";
import { TCalendarView } from "@/lib/types";

export default function RequestHeader({
  view,
  date,
  roomId,
  isHeaderLoading,
  totalEvents,
  OnRoomChange,
}: {
  view: TCalendarView;
  date: Date;
  roomId: string;
  isHeaderLoading: boolean;
  totalEvents: number;
  OnRoomChange: (value: string) => void;
}) {
  return (
    <div className="flex flex-col gap-4 border-b p-4 min-w-90 lg:flex-row lg:items-center lg:justify-between">
      <div className="flex items-center gap-3">
        <TodayButton view={view} />

        <RequestNavigator
          view={view}
          selectedDate={date}
          isHeaderLoading={isHeaderLoading}
          totalEvents={totalEvents}
          onPreviousClick={() => {}}
          onNextClick={() => {}}
        />
      </div>

      <div className="flex flex-col items-center gap-1.5 sm:flex-row sm:justify-between">
        <div className="flex w-full items-center gap-1.5"></div>
        <div className="w-full sm:w-auto">
          <RoomSelect selectedRoomId={roomId} onRoomChange={OnRoomChange} />
        </div>
        <div className="w-full sm:w-auto">
          <StatusSelect selectedStatusId="-1" onStatusChange={() => {}} />
        </div>
        <div className="inline-flex first:rounded-r-none last:rounded-l-none [&:not(:first-child):not(:last-child)]:rounded-none">
          <Button
            asChild
            aria-label="Between Period"
            size="icon"
            variant={view === "day" ? "default" : "outline"}
            className="rounded-r-none [&_svg]:size-5"
          >
            <Link href={""}>
              <Calendar strokeWidth={1.8} />
            </Link>
          </Button>

          <Button
            asChild
            aria-label="By Day"
            size="icon"
            variant={view === "week" ? "default" : "outline"}
            className="-ml-px rounded-none [&_svg]:size-5"
          >
            <Link href={""}>
              <Columns strokeWidth={1.8} />
            </Link>
          </Button>

          <Button
            asChild
            aria-label="By Week"
            size="icon"
            variant={view === "month" ? "default" : "outline"}
            className="-ml-px rounded-none [&_svg]:size-5"
          >
            <Link href={""}>
              <Grid2x2 strokeWidth={1.8} />
            </Link>
          </Button>

          <Button
            asChild
            aria-label="By Month"
            size="icon"
            variant={view === "year" ? "default" : "outline"}
            className="-ml-px rounded-none [&_svg]:size-5"
          >
            <Link href={""}>
              <Grid3x3 strokeWidth={1.8} />
            </Link>
          </Button>

          <Button
            asChild
            aria-label="By Year"
            size="icon"
            variant={view === "agenda" ? "default" : "outline"}
            className="-ml-px rounded-l-none [&_svg]:size-5"
          >
            <Link href={""}>
              <CalendarRange strokeWidth={1.8} />
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
