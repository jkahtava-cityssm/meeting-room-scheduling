"use client";

import { startOfDay, endOfDay, format, isToday } from "date-fns";
import { useCalendar } from "@/contexts/CalendarProvider";

import { useEffect, useMemo, useRef, useState } from "react";

import { CalendarDayViewSkeleton } from "./skeleton-calendar-day-view";
import { IEvent } from "@/lib/schemas/calendar";
import { TVisibleHours } from "@/lib/types";

import { CalendarDayColumnCalendar } from "./calendar-day-column-calendar";
import { useEventsQuery } from "@/lib/services/events";
import { DailyTimeBlocks } from "@/app/features/calendar/calendar-util/calendar-day-grid";
import { CalendarDayGridProvider } from "@/app/features/calendar/calendar-util/calendar-day-grid-context";
import { DayViewDayHeader } from "./calendar-day-view-day-header";
import { useCalendarDayGrid } from "@/app/features/calendar/calendar-util/use-calendar-day-grid";
import { IDayGrid } from "@/app/features/calendar/calendar-util/calendar-day-grid-webworker";
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

  const { interval, visibleHours, visibleRooms, selectedRoomId, setIsHeaderLoading, setTotalEvents } = useCalendar();
  const [hours, setHours] = useState<number[] | undefined>(undefined);
  // stable derived props for children — avoids passing new references each render
  const visibleRoomsForGrid = useMemo(() => visibleRooms ?? [], [visibleRooms]);
  const selectedRoomIdNumber = useMemo(() => Number(selectedRoomId), [selectedRoomId]);

  const startDate = useMemo(() => startOfDay(date), [date]);
  const endDate = useMemo(() => endOfDay(date), [date]);

  const [dayViews, setDayViews] = useState<IDayGrid | undefined>(undefined);

  const { data: events, error } = useEventsQuery(startDate, endDate, userId);
  const { data: gridData, loading: gridLoading, error: gridError, postMessage } = useCalendarDayGrid();

  // Derived mounting state — true while initial data hasn't arrived
  const isMounting = !gridData || events === undefined;

  useEffect(() => {
    setLoading(true);
  }, [date]);

  useEffect(() => {
    if (!gridError) return;

    setTotalEvents(0);

    setIsHeaderLoading(false);
    //setLoading(false);
  }, [gridError, setIsHeaderLoading, setTotalEvents, visibleHours]);

  useEffect(() => {
    if (!events) return;
    setIsHeaderLoading(true);
    // Pre-filter events by selected room when possible so the worker
    // doesn't need to filter by room (reduces work and avoids reprocessing)

    postMessage({
      events: events,
      currentDate: date,
      startDate: startDate,
      endDate: endDate,
      selectedRooms: visibleRoomsForGrid.map((room) => room.roomId.toString()),
      visibleHours: visibleHours,
    });
  }, [
    events,
    date,
    visibleRoomsForGrid,
    visibleHours,
    postMessage,
    setIsHeaderLoading,
    visibleRooms,
    startDate,
    endDate,
  ]);

  useEffect(() => {
    if (!gridData) return;
    setDayViews(gridData.dayView);
    setHours(gridData.hours);
    setTotalEvents(gridData.totalEvents);
    setIsHeaderLoading(false);
    setLoading(false);
  }, [gridData, setIsHeaderLoading, setTotalEvents]);

  if (false) {
    return (
      <div className="flex">
        <CalendarDayViewSkeleton />
        <CalendarDayColumnCalendar
          date={date}
          isLoading={isLoading}
          events={events ?? []}
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
      <div className="flex flex-1 min-h-0">
        <div
          className={cn(
            "flex flex-col min-h-0  min-w-0 transition-[width] duration-600 ease-in-out flex-1",
            breakpoints3,
          )}
        >
          <DayViewDayHeader currentDate={date} />

          <CalendarDayGridProvider
            value={{
              hours,
              currentDate: date,
              userId,
              interval,
              allowCreateEvent,
              isLoading,
            }}
          >
            <DailyTimeBlocks
              isLoading={isLoading}
              roomBlocks={dayViews?.roomBlocks}
              dayIndex={"0"}
              selectedRoomId={selectedRoomIdNumber}
              visibleRooms={visibleRoomsForGrid}
            />
          </CalendarDayGridProvider>
        </div>
        <CalendarDayColumnCalendar
          date={date}
          isLoading={isLoading}
          events={events ? events : []}
          view={"day"}
        ></CalendarDayColumnCalendar>
      </div>
    </>
  );
}
