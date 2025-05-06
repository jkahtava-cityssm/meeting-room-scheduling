import { startOfWeek, addDays, format, parseISO, isSameDay, areIntervalsOverlapping, endOfWeek } from "date-fns";

import { useCalendar } from "@/calendar/contexts/calendar-context";

import { ScrollArea } from "@/components/ui/scroll-area";

import { AddEventDialog } from "@/calendar/components/dialogs/add-event-dialog";
//import { EventBlock } from "@/calendar/components/week-and-day-view/event-block";
import { CalendarTimeline } from "@/calendar/components/week-and-day-view/calendar-time-line";
import { WeekViewMultiDayEventsRow } from "@/calendar/components/week-and-day-view/week-view-multi-day-events-row";

import { cn } from "@/lib/utils";
import {
  groupEvents,
  getEventBlockStyle,
  isWorkingHour,
  getVisibleHours,
  splitMultiDayEvents,
  getOverlappingMultiDayEvents,
} from "@/calendar/helpers";

import type { IEvent } from "@/calendar/interfaces";
import { DayHourlyEventDialogs } from "../day-hourly-event-dialogs";
import { HourColumn } from "../column-hourly";
import { ColumnDayHeader } from "../column-day-header";
import { EventBlock } from "../event-block";
import { useEffect, useState } from "react";
import { getEvents } from "@/services/events";
import { CalendarHeaderSkeleton } from "../header/calendar-header-skeleton";
import { CalendarHeader } from "../header/calendar-header";
import { Skeleton } from "@/components/ui/skeleton";
import { SingleCalendar } from "@/components/ui/single-calendar";
import { ColumnDayHeaderSkeleton } from "../column-day-header-skeleton";

interface IProps {
  events: IEvent[];
}

export function CalendarDayViewSkeleton() {
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(startOfWeek(new Date()), i));
  const hours = [...Array(24).keys()];

  return (
    <>
      <div className="flex">
        <div className="flex flex-1 flex-col">
          <ColumnDayHeaderSkeleton weekDays={[new Date()]} />
          <ScrollArea className="max-h-[50vh] md:max-h-[60vh] lg:max-h-[70vh] xl:max-h-[73vh]" type="always">
            <div className="flex border-l">
              <HourColumn hours={hours} />

              <div className="relative flex-1 border-b">
                <div className="relative">
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
                <CalendarTimeline />
              </div>
            </div>
          </ScrollArea>
        </div>

        <div className="hidden w-74 divide-y border-l md:block">
          <div className="flex flex-col">
            <div className="flex flex-1 gap-1 pt-2 pl-3 pr-3 items-center">
              <Skeleton className="size-7" />
              <Skeleton className="w-28 h-9 " />
              <Skeleton className="w-20 h-9" />
              <Skeleton className="size-7" />
            </div>

            <div className="flex-1 space-y-2  border-t-0 p-3">
              <div className="grid grid-cols-7 text-center">
                {weekDays.map((day, index) => (
                  <div key={index} className="w-8 text-sm font-normal text-muted-foreground">
                    {format(day, "EEEEEE")}
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-7 gap-0 ">
                {[...Array(42).keys()].map((index) => {
                  return <Skeleton key={index} className="flex flex-1 size-7 p-0 m-1 rounded-md " />;
                })}
              </div>
            </div>
            <div className="bg-accent rounded-bl-sm rounded-br-sm  pl-3 pr-3">
              <Skeleton className="inline-flex items-center justify-center whitespace-nowrap text-sm font-medium   shrink-0  outline-none  border bg-background shadow-xs dark:bg-input/30 dark:border-input  h-8 rounded-md gap-1.5 px-3  m-1">
                Today
              </Skeleton>
            </div>
          </div>

          <div className="flex-1 space-y-2">
            <div className="flex items-start gap-1 px-4 pt-4">
              <Skeleton className="w-full h-4"></Skeleton>
            </div>
            <div className="flex items-start gap-1 px-4 ">
              <Skeleton className="w-full h-4"></Skeleton>
            </div>
            <div className="flex items-start gap-1 px-4 ">
              <Skeleton className="w-full h-4"></Skeleton>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
