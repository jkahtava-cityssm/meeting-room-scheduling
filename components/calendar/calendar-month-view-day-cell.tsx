import { useMemo } from "react";
import { isToday, startOfDay } from "date-fns";
import { eventBadgeVariants, MonthEventBadge } from "@/components/calendar/calendar-month-event-badge";
import { cn } from "@/lib/utils";
import { getMonthCellEvents, MAX_VISIBLE_EVENTS } from "@/lib/helpers";
import type { ICalendarCell } from "@/lib/interfaces";
import { ScrollArea } from "@radix-ui/react-scroll-area";
import { Button } from "../ui/button";
import { IEvent } from "@/lib/schemas/schemas";
import { DayView } from "./calendar-month-view";

export function MonthViewDayCell({ dayRecord }: { dayRecord: DayView }) {
  /* const { day, currentMonth, date } = cell;

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
  }*/

  const currentMonth: boolean = true;
  const isSunday: boolean = false;

  if (!dayRecord) {
    return;
  }

  return (
    <div className={cn("flex h-full flex-col gap-1 border-l border-t py-1 overflow-hidden", isSunday && "border-l-0")}>
      <Button
        variant={"ghost"}
        className={cn(
          "flex w-8 translate-x-1 items-center justify-center h-4 px-1 text-xs font-semibold lg:px-2",
          !currentMonth && "opacity-20 hover:bg-primary/20",
          dayRecord.isToday && "rounded-full bg-primary px-0 font-bold text-primary-foreground"
        )}
      >
        {dayRecord.day}
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
            {dayRecord.eventRecords.map((record, index) => {
              //const event = cellEvents.find((e) => e.position === position);
              const eventKey = record.event
                ? `event-${record.event.eventId}-${dayRecord.dayDate.toISOString()}-${index}`
                : `empty-${record.position}`;

              if (record.event) {
                return (
                  <div key={eventKey} className="md:flex-1">
                    {record.event && (
                      <MonthEventBadge
                        className="hidden sm:flex"
                        event={record.event}
                        cellDate={startOfDay(dayRecord.dayDate)}
                      />
                    )}
                  </div>
                );
              } else {
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
        {dayRecord.eventRecords.length > 0 && <span className="sm:hidden">+{dayRecord.eventRecords.length}</span>}
        {dayRecord.eventRecords.length > 0 && (
          <span className="hidden sm:block"> {dayRecord.eventRecords.length} events</span>
        )}
        {
          //cellEvents.length > 0 && <span className="sm:hidden">+{cellEvents.length}</span>
        }
        {
          //cellEvents.length > MAX_VISIBLE_EVENTS && (
          //<span className="hidden sm:block"> {cellEvents.length - MAX_VISIBLE_EVENTS} more...</span>
          //)
        }
      </p>
    </div>
  );
}
