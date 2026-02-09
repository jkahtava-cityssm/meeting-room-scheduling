"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { endOfYear, startOfYear } from "date-fns";

import { usePrivateCalendar } from "@/contexts/CalendarProviderPrivate";
import YearViewMonth from "./calendar-year-view-month";
import { IEvent } from "@/lib/schemas/calendar";
import { YearViewSkeleton } from "./skeleton-calendar-year-view";
import { TVisibleHours } from "@/lib/types";
import { useEventsQuery } from "@/lib/services/events";
import { usePrivateCalendarEvents } from "../webworkers/use-calendar-private-events";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";

export function CalendarYearView({ date, userId }: { date: Date; userId?: string }) {
  const { interval, visibleHours, visibleRooms, selectedRoomId, setIsHeaderLoading, setTotalEvents } =
    usePrivateCalendar();

  const roomIds = useMemo(
    () => (visibleRooms ? visibleRooms.map((room) => room.roomId.toString()) : []),
    [visibleRooms],
  );

  const { result, isLoading } = usePrivateCalendarEvents("YEAR", date, visibleHours, userId, selectedRoomId);

  useEffect(() => {
    if (isLoading) {
      setIsHeaderLoading(true);
    }

    if (result && !isLoading) {
      setIsHeaderLoading(false);
    }
  }, [isLoading, result, setIsHeaderLoading, setTotalEvents]);

  useEffect(() => {
    if (!result) return;

    setTotalEvents(result.totalEvents);
  }, [result, setTotalEvents]);

  const isMounting = !visibleRooms || !result;

  if (isMounting) {
    return <YearViewSkeleton date={date}></YearViewSkeleton>;
  }

  return (
    <>
      <ScrollArea className="h-full w-full min-h-0 bg-background">
        <div className="p-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {result?.data.monthViews.map((month) => {
              return <YearViewMonth key={month.month.toString()} month={month} />;
            })}
          </div>
        </div>
        <ScrollBar orientation="vertical" />
      </ScrollArea>
    </>
  );
}
