import { RoomSelect } from "@/app/features/rooms/room-select";
import { StatusSelect } from "@/app/features/status/status-select";

import { Button } from "@/components/ui/button";
import { Calendar, CalendarRange, Columns, Grid2x2, Grid3x3 } from "lucide-react";
import Link from "next/link";
import { RequestNavigator } from "./request-navigator";
import { TCalendarView } from "@/lib/types";
import { navigateDate, navigateURL } from "@/lib/helpers";
import { format } from "date-fns";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { TooltipPortal } from "@radix-ui/react-tooltip";
import { useRouter } from "next/navigation";
import { TodayButton } from "../../calendar/calendar-controller/calendar-all-header-today-button";

export default function RequestHeader({
  view,
  selectedDate,
  roomId,
  statusId,
  isHeaderLoading,
  totalEvents,
  OnRoomChange,
  OnStatusChange,
}: {
  view: TCalendarView;
  selectedDate: Date;
  roomId: string;
  statusId: string;
  isHeaderLoading: boolean;
  totalEvents: number;
  OnRoomChange: (value: string) => void;
  OnStatusChange: (value: string) => void;
}) {
  const { push } = useRouter();

  const handleNavigatePrevious = () => {
    const previousDate = navigateDate(selectedDate, view, "previous");

    push(navigateURL(previousDate, view));
  };

  const handleNavigateNext = () => {
    const nextDate = navigateDate(selectedDate, view, "next");

    push(navigateURL(nextDate, view));
  };

  return (
    <div className="flex flex-col gap-4 border-b p-4 min-w-90 lg:flex-row lg:items-center lg:justify-between">
      <div className="flex items-center gap-3">
        <TodayButton view={view} />

        <RequestNavigator
          view={view}
          selectedDate={selectedDate}
          isHeaderLoading={isHeaderLoading}
          totalEvents={totalEvents}
          onPreviousClick={handleNavigatePrevious}
          onNextClick={handleNavigateNext}
        />
      </div>

      <div className="flex flex-col items-center gap-1.5 sm:flex-row sm:justify-between">
        <div className="flex w-full items-center gap-1.5"></div>
        <div className="w-full sm:w-auto">
          <RoomSelect selectedRoomId={roomId} includeAllOption={true} onRoomChange={OnRoomChange} />
        </div>
        <div className="w-full sm:w-auto">
          <StatusSelect selectedStatusId={statusId} includeAllOption={false} onStatusChange={OnStatusChange} />
        </div>
        <div className="inline-flex first:rounded-r-none last:rounded-l-none [&:not(:first-child):not(:last-child)]:rounded-none">
          <Tooltip delayDuration={500}>
            <TooltipTrigger asChild>
              <Button
                asChild
                aria-label="By Day"
                size="icon"
                variant={view === "day" ? "default" : "outline"}
                className="rounded-r-none [&_svg]:size-5"
              >
                <Link href={navigateURL(selectedDate, "day")}>
                  <Calendar strokeWidth={1.8} />
                </Link>
              </Button>
            </TooltipTrigger>
            <TooltipPortal>
              <TooltipContent className="max-w-64" side="top" sticky="always">
                Day View
              </TooltipContent>
            </TooltipPortal>
          </Tooltip>

          <Tooltip delayDuration={500}>
            <TooltipTrigger asChild>
              <Button
                asChild
                aria-label="By Month"
                size="icon"
                variant={view === "month" ? "default" : "outline"}
                className="-ml-px rounded-none [&_svg]:size-5"
              >
                <Link href={navigateURL(selectedDate, "month")}>
                  <Columns strokeWidth={1.8} />
                </Link>
              </Button>
            </TooltipTrigger>
            <TooltipPortal>
              <TooltipContent className="max-w-64" side="top" sticky="always">
                Month View
              </TooltipContent>
            </TooltipPortal>
          </Tooltip>

          <Tooltip delayDuration={500}>
            <TooltipTrigger asChild>
              <Button
                asChild
                aria-label="By Year"
                size="icon"
                variant={view === "year" ? "default" : "outline"}
                className="-ml-px rounded-none [&_svg]:size-5"
              >
                <Link href={navigateURL(selectedDate, "year")}>
                  <Grid2x2 strokeWidth={1.8} />
                </Link>
              </Button>
            </TooltipTrigger>
            <TooltipPortal>
              <TooltipContent className="max-w-64" side="top" sticky="always">
                Year View
              </TooltipContent>
            </TooltipPortal>
          </Tooltip>

          <Tooltip delayDuration={500}>
            <TooltipTrigger asChild>
              <Button
                asChild
                aria-label="All Time"
                size="icon"
                variant={view === "all" ? "default" : "outline"}
                className="-ml-px rounded-none [&_svg]:size-5"
              >
                <Link href={navigateURL(selectedDate, "all")}>
                  <Grid3x3 strokeWidth={1.8} />
                </Link>
              </Button>
            </TooltipTrigger>
            <TooltipPortal>
              <TooltipContent className="max-w-64" side="top" sticky="always">
                All of Time View
              </TooltipContent>
            </TooltipPortal>
          </Tooltip>

          <Tooltip delayDuration={500}>
            <TooltipTrigger asChild>
              <Button
                asChild
                aria-label="By Year"
                size="icon"
                variant={view === "agenda" ? "default" : "outline"}
                className="-ml-px rounded-l-none [&_svg]:size-5"
              >
                <Link href={navigateURL(selectedDate, "year")}>
                  <CalendarRange strokeWidth={1.8} />
                </Link>
              </Button>
            </TooltipTrigger>
            <TooltipPortal>
              <TooltipContent className="max-w-64" side="top" sticky="always">
                OTHER????
              </TooltipContent>
            </TooltipPortal>
          </Tooltip>
        </div>
      </div>
    </div>
  );
}
