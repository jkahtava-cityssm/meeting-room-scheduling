"use client";

import { startOfDay, endOfDay, format, isToday } from "date-fns";
import { useCalendar } from "@/contexts/CalendarProvider";
import { ScrollArea } from "@/components/ui/scroll-area";

import { CalendarTimeline } from "@/components/calendar/calendar-day-timeline";

import { EventBlock } from "./calendar-day-event-block";
import { useEffect, useRef, useState } from "react";

import { CalendarDayViewSkeleton } from "./skeleton-calendar-day-view";
import { IEvent } from "@/lib/schemas/calendar";
import { TVisibleHours, TWorkingHours } from "@/lib/types";

import { CalendarDayColumnCalendar } from "./calendar-day-column-calendar";
import { useEventsQuery } from "@/lib/services/events";
import { Alert, AlertDescription, AlertTitle } from "../ui/alert";
import { Terminal } from "lucide-react";
import { Button } from "../ui/button";
import { CalendarAccessDenied } from "./calendar-all-views";
import { getVisibleHours } from "@/lib/helpers";
import { DailyTimeBlocks } from "@/app/features/calendar/calendar-util/calendar-day-grid";
import { DayViewDayHeader } from "./calendar-day-view-day-header";
import { useCalendarDayGrid } from "@/app/features/calendar/calendar-util/use-calendar-day-grid";
import { IBlock, IDayGrid } from "@/app/features/calendar/calendar-util/calendar-day-grid-webworker";
import { cn } from "@/lib/utils";

export interface IDayProcessData {
  events: IEvent[];
  selectedDate: Date;
  selectedRoomId: string;
  pixelHeight: number;
  visibleHours: TVisibleHours;
  multiDayEventsAtTop: boolean;
}

export interface IDayResponseData {
  totalEvents: number;
  dayViews: IDayView[];
  hours: number[];
  filteredEvents: IEvent[];
  roomIds: number[];
}

export interface IDayView {
  day: number;
  dayDate: Date;
  isToday: boolean;
  eventBlocks: IEventBlock[];
}

export interface IEventBlock {
  groupIndex: number;
  eventIndex: number;
  eventStyle: { top: string; width: string; left: string };
  eventHeight: number;
  event: IEvent;
  roomId: number;
}

export function CalendarDayView({
  date,
  userId,
  isSidebarOpen = false,
  allowCreateEvent,
}: {
  date: Date;
  userId?: string;
  isSidebarOpen?: boolean;
  allowCreateEvent: boolean;
}) {
  const [isLoading, setLoading] = useState(true);
  const [isRefreshed, setRefreshed] = useState(false);

  const [filteredEvents, setFilteredEvents] = useState<IEvent[]>([]);
  const [hours, setHours] = useState<number[]>([]);
  const [rooms, setRooms] = useState<number[]>([]);

  const { interval, visibleHours, visibleRooms, selectedRoomId, setIsHeaderLoading, setTotalEvents } = useCalendar();

  const workerRef = useRef<Worker | null>(null);

  const startDate: Date = startOfDay(date);
  const endDate: Date = endOfDay(date);

  const [dayViews, setDayViews] = useState<IDayGrid>({
    day: date.getDate(),
    dayDate: date,
    isToday: isToday(date),
    roomBlocks: new Map<string, IBlock[]>(),
  });

  const { data: events, error } = useEventsQuery(startDate, endDate, userId);
  const { data: gridData, loading: gridLoading, error: gridError, postMessage } = useCalendarDayGrid();

  useEffect(() => {
    if (!gridError) return;

    setTotalEvents(0);
    setHours(getVisibleHours(visibleHours, []).hours);
    setIsHeaderLoading(false);
    setLoading(false);
  }, [gridError, setIsHeaderLoading, setTotalEvents, visibleHours]);

  useEffect(() => {
    if (!events) return;
    setIsHeaderLoading(true);
    setLoading(true);
    postMessage({
      events: events,
      currentDate: date,
      startDate: startOfDay(date),
      endDate: endOfDay(date),
      selectedRooms: visibleRooms?.map((room) => String(room.roomId)) || [],
      visibleHours: visibleHours,
    });
  }, [events, date, selectedRoomId, visibleHours, postMessage, setIsHeaderLoading, visibleRooms]);

  useEffect(() => {
    if (!gridData) return;
    setDayViews(gridData.dayView);
    setHours(gridData.hours);
    setTotalEvents(gridData.totalEvents);
    setIsHeaderLoading(false);
    setLoading(false);
  }, [gridData, setIsHeaderLoading, setTotalEvents]);

  if (isLoading) {
    return (
      <div className="flex">
        <CalendarDayViewSkeleton />
        <CalendarDayColumnCalendar
          date={date}
          isLoading={isLoading}
          events={filteredEvents}
          view={"day"}
        ></CalendarDayColumnCalendar>
      </div>
    );
  }

  const breakpoints3 = isSidebarOpen ? "w-[calc(100dvw-var(--sidebar-width)-32px-300px)]" : "w-[calc(100dvw-300px)]";
  //w-full
  // transition-[width] duration-150 ease-linear
  return (
    <>
      <div className="flex">
        <div className={cn("flex flex-col  min-w-0 transition-[width] duration-600 ease-in-out", breakpoints3)}>
          <DayViewDayHeader key={dayViews.day} currentDate={dayViews.dayDate} />
          <DailyTimeBlocks
            hours={hours}
            currentDate={dayViews.dayDate}
            userId={userId}
            roomBlocks={dayViews.roomBlocks}
            dayIndex={String(0)}
            interval={interval}
            allowCreateEvent={allowCreateEvent}
            selectedRoomId={Number(selectedRoomId)}
            visibleRooms={visibleRooms ? visibleRooms : []}
          ></DailyTimeBlocks>
        </div>
        <CalendarDayColumnCalendar
          date={date}
          isLoading={isLoading}
          events={filteredEvents}
          view={"day"}
        ></CalendarDayColumnCalendar>
      </div>
    </>
  );
}
