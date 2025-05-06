"use client";

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
import { ColumnDayHeaderSkeleton } from "../column-day-header-skeleton";

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
