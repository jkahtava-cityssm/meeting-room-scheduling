import Link from "next/link";
import { Columns, Grid3x3, List, Plus, Grid2x2, CalendarRange } from "lucide-react";
import { Button } from "@/components/ui/button";
import { RoomSelect } from "@/components/calendar/calendar-all-header-room-select";
import { TodayButton } from "@/components/calendar/calendar-all-header-today-button";
import { DateNavigator } from "@/components/calendar/calendar-all-header-date-navigator";
import { AddEventDialog } from "@/components/calendar/dialog-event-add";

import type { TCalendarView } from "@/lib/types";
import { IEvent } from "@/lib/schemas/schemas";
import { navigateURL } from "@/lib/helpers";

export function CalendarHeader({
  view,
  events,
  selectedDate,
  isLoading,
  onPreviousClick,
  onNextClick,
  onRoomChange,
}: {
  view: TCalendarView;
  events: IEvent[];
  selectedDate: Date;
  isLoading: boolean;
  onPreviousClick: () => void;
  onNextClick: () => void;
  onRoomChange: (value: string) => void;
}) {
  return (
    <>
      <div className="flex flex-col gap-4 border-b p-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-3">
          <TodayButton />
          <DateNavigator
            view={view}
            selectedDate={selectedDate}
            events={events}
            isLoading={isLoading}
            onPreviousClick={onPreviousClick}
            onNextClick={onNextClick}
          />
        </div>

        <div className="flex flex-col items-center gap-1.5 sm:flex-row sm:justify-between">
          <div className="flex w-full items-center gap-1.5">
            <div className="inline-flex first:rounded-r-none last:rounded-l-none [&:not(:first-child):not(:last-child)]:rounded-none">
              <Button
                asChild
                aria-label="View by day"
                size="icon"
                variant={view === "day" ? "default" : "outline"}
                className="rounded-r-none [&_svg]:size-5"
              >
                <Link href={navigateURL(selectedDate, "day")}>
                  <List strokeWidth={1.8} />
                </Link>
              </Button>

              <Button
                asChild
                aria-label="View by week"
                size="icon"
                variant={view === "week" ? "default" : "outline"}
                className="-ml-px rounded-none [&_svg]:size-5"
              >
                <Link href={navigateURL(selectedDate, "week")}>
                  <Columns strokeWidth={1.8} />
                </Link>
              </Button>

              <Button
                asChild
                aria-label="View by month"
                size="icon"
                variant={view === "month" ? "default" : "outline"}
                className="-ml-px rounded-none [&_svg]:size-5"
              >
                <Link href={navigateURL(selectedDate, "month")}>
                  <Grid2x2 strokeWidth={1.8} />
                </Link>
              </Button>

              <Button
                asChild
                aria-label="View by year"
                size="icon"
                variant={view === "year" ? "default" : "outline"}
                className="-ml-px rounded-none [&_svg]:size-5"
              >
                <Link href={navigateURL(selectedDate, "year")}>
                  <Grid3x3 strokeWidth={1.8} />
                </Link>
              </Button>

              <Button
                asChild
                aria-label="View by agenda"
                size="icon"
                variant={view === "agenda" ? "default" : "outline"}
                className="-ml-px rounded-l-none [&_svg]:size-5"
              >
                <Link href={navigateURL(selectedDate, "agenda")}>
                  <CalendarRange strokeWidth={1.8} />
                </Link>
              </Button>
            </div>

            <RoomSelect onRoomChange={onRoomChange} />
          </div>

          <AddEventDialog>
            <Button className="w-full sm:w-auto">
              <Plus />
              Add Event
            </Button>
          </AddEventDialog>
        </div>
      </div>
    </>
  );
}
