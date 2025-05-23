import { useMemo } from "react";
import { isToday, startOfDay } from "date-fns";
import { eventBadgeVariants, MonthEventBadge } from "@/components/calendar/calendar-month-event-badge";
import { cn } from "@/lib/utils";
import { getMonthCellEvents, MAX_VISIBLE_EVENTS } from "@/lib/helpers";
import type { ICalendarCell } from "@/lib/interfaces";
import { ScrollArea } from "@radix-ui/react-scroll-area";
import { Button } from "../ui/button";
import { IEvent } from "@/lib/schemas/schemas";

export function MonthViewDayCell({
  cell,
  events,
  eventPositions,
  fetchData,
}: {
  cell: ICalendarCell;
  events: IEvent[];
  eventPositions: Record<string, number>;
  fetchData: () => Promise<void>;
}) {
  const { day, currentMonth, date } = cell;

  const cellEvents = useMemo(() => getMonthCellEvents(date, events, eventPositions), [date, events, eventPositions]);
  const isSunday = date.getDay() === 0;

  let maxPosition = 0;

  if (cellEvents.length > 0) {
    maxPosition = cellEvents.reduce(function (prev, current) {
      return prev && prev.position > current.position ? prev : current;
    }).position;
  }

  if (maxPosition > MAX_VISIBLE_EVENTS) {
    maxPosition = MAX_VISIBLE_EVENTS;
  }

  return (
    <div className={cn("flex h-full flex-col gap-1 border-l border-t py-1 overflow-hidden", isSunday && "border-l-0")}>
      <Button
        variant={"ghost"}
        className={cn(
          "flex w-8 translate-x-1 items-center justify-center h-4 px-1 text-xs font-semibold lg:px-2",
          !currentMonth && "opacity-20 hover:bg-primary/20",
          isToday(date) && "rounded-full bg-primary px-0 font-bold text-primary-foreground"
        )}
      >
        {day}
      </Button>
      {/*<span
        className={cn(
          "flex w-6 translate-x-1 items-center justify-center h-4 px-1 text-xs font-semibold lg:px-2",
          !currentMonth && "opacity-20",
          isToday(date) && "rounded-full bg-primary px-0 font-bold text-primary-foreground"
        )}
      >
        {day}
      </span>
      */}
      <div className={cn("flex h-6 gap-1 px-2 sm:h-18 lg:h-23 sm:flex-col sm:px-0", !currentMonth && "opacity-50")}>
        <ScrollArea type="always" className="max-h-[200px] overflow-y-auto overflow-x-hidden">
          <div className="flex flex-col gap-1 ">
            {[...Array(maxPosition + 1).keys()].map((position) => {
              const event = cellEvents.find((e) => e.position === position);
              const eventKey = event ? `event-${event.eventId}-${position}` : `empty-${position}`;

              if (event) {
                return (
                  <div key={eventKey} className="md:flex-1">
                    {event && (
                      <MonthEventBadge
                        className="hidden sm:flex"
                        event={event}
                        cellDate={startOfDay(date)}
                        fetchData={fetchData}
                      />
                    )}
                  </div>
                );
              } else if (position < maxPosition + 1) {
                //WHEN THERE ARE MULTIPLE EVENTS THAT SPAN ACROSS COLUMNS WE ADD A BLANK ENTRY TO KEEP THE MULTI DAY EVENTS
                //ON IN THE SAME ROW WHEN POSSIBLE
                return (
                  <div key={eventKey} className="md:flex-1">
                    <div className={cn(eventBadgeVariants({ color: "invisible" }), "hidden sm:flex")}></div>
                  </div>
                );
              }
            })}
          </div>
        </ScrollArea>
      </div>
      <p className={cn("h-4.5 px-1.5 text-xs font-semibold text-muted-foreground", !currentMonth && "opacity-50")}>
        {cellEvents.length > 0 && <span className="sm:hidden">+{cellEvents.length}</span>}
        {cellEvents.length > MAX_VISIBLE_EVENTS && (
          <span className="hidden sm:block"> {cellEvents.length - MAX_VISIBLE_EVENTS} more...</span>
        )}
      </p>
    </div>
  );
}
