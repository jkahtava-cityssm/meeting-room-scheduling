"use client";

import { startOfWeek, addDays } from "date-fns";
import { ScrollArea } from "@/components/ui/scroll-area";
import { CalendarTimeline } from "@/components/calendar/calendar-day-timeline";
import { cn } from "@/lib/utils";

import { HourColumn } from "./calendar-day-column-hourly";
import { Skeleton } from "@/components/ui/skeleton";
import { ColumnDayHeaderSkeleton } from "./skeleton-calendar-day-column-header";
import { IEvent } from "@/lib/schemas/schemas";

interface IProps {
  events: IEvent[];
}

export function CalendarWeekViewSkeleton() {
  const weekStart = startOfWeek(new Date());
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const hours = [...Array(24).keys()];

  return (
    <>
      <ColumnDayHeaderSkeleton weekDays={weekDays} />
      <ScrollArea className="max-h-[50vh] md:max-h-[60vh] lg:max-h-[70vh] xl:max-h-[73vh]" type="always">
        <div className="flex overflow-hidden">
          <HourColumn hours={hours} />

          <div className="relative flex-1 border-l">
            <div className="grid grid-cols-7 divide-x">
              {weekDays.map((day, dayIndex) => {
                return (
                  <div key={dayIndex} className="relative">
                    {hours.map((hour, index) => {
                      return (
                        <div key={hour} className={cn("relative")} style={{ height: "96px" }}>
                          {index !== 0 && <div className="pointer-events-none absolute inset-x-0 top-0 border-b"></div>}
                          <Skeleton className="absolute inset-x-0 top-[2px] h-[44px] transition-colors hover:bg-accent rounded-none"></Skeleton>

                          <div className="pointer-events-none absolute inset-x-0 top-1/2 border-b border-dashed border-1"></div>

                          <Skeleton className="absolute inset-x-0 top-[52px] h-[42px] transition-colors rounded-none"></Skeleton>
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>

            <CalendarTimeline />
          </div>
        </div>
      </ScrollArea>
    </>
  );
}
