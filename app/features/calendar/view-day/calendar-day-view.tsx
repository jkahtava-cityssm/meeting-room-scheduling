"use client";
import { usePrivateCalendar } from "@/contexts/CalendarProviderPrivate";

import { useEffect, useMemo } from "react";

import { DayViewDayHeader } from "./calendar-day-view-day-header";

import { cn } from "@/lib/utils";
import { CalendarDayColumnCalendar } from "../sidebar-day-picker/calendar-day-column-calendar";
import { CalendarPermissions } from "../permissions/calendar.permissions";
import { usePrivateCalendarEvents } from "../webworkers/use-calendar-private-events";
import { CalendarScrollContainerPrivate } from "../components/calendar-scroll-container";
import { CalendarScrollColumnPrivate } from "../components/calendar-scroll-column";
import { CalendarWeekViewSkeleton } from "../view-week/skeleton-calendar-week-view";
import { CalendarScrollContainerSkeleton } from "../components/calendar-scroll-container-skeleton";
import { CalendarAccessDenied } from "../calendar-controller/calendar-all-views";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Terminal } from "lucide-react";

export function CalendarDayView({
  date,
  userId,
  isSidebarOpen = false,
}: {
  date: Date;
  userId?: string;
  isSidebarOpen?: boolean;
}) {
  const { can } = CalendarPermissions.usePermissions();
  const { interval, visibleHours, defaultHours, visibleRooms, selectedRoomId, setIsHeaderLoading, setTotalEvents } =
    usePrivateCalendar();

  const roomIds = useMemo(
    () => (visibleRooms ? visibleRooms.map((room) => room.roomId.toString()) : []),
    [visibleRooms],
  );

  const { result, isLoading, error } = usePrivateCalendarEvents("DAY", date, visibleHours, userId, roomIds);

  useEffect(() => {
    if (isLoading) {
      setIsHeaderLoading(true);
    }

    if (result && !isLoading) {
      setIsHeaderLoading(false);
    }
  }, [isLoading, result, setIsHeaderLoading, setTotalEvents]);

  const { roomsToRender, events } = useMemo(() => {
    const rooms =
      visibleRooms
        ?.filter((room) => selectedRoomId === "-1" || String(room.roomId) === selectedRoomId)
        .map((room) => {
          const blocks = result?.data.roomBlocks?.get(String(room.roomId)) ?? [];
          return { roomId: room.roomId, roomName: room.name, blocks };
        }) ?? []; // Flatten all events from all blocks
    const events = rooms.flatMap(
      (room) => room.blocks.map((block) => block.event).filter(Boolean), // remove null/undefined
    );

    return { roomsToRender: rooms, events };
  }, [visibleRooms, selectedRoomId, result]);

  useEffect(() => {
    setTotalEvents(events.length);
  }, [events, setTotalEvents]);

  const isMounting = !visibleRooms || !result;

  if (error) {
    return (
      <div className="flex flex-1 min-h-0">
        <div className={cn("flex flex-col min-h-0  min-w-0 transition-[width] duration-600 ease-in-out flex-1 p-4")}>
          <Alert variant="destructive" className="mt-4 ">
            <Terminal className="h-4 w-4" />
            <AlertTitle>{error ? error.name : "Permission Denied"}</AlertTitle>
            <AlertDescription>
              {error ? error.message : "You do not have permission to view this content"}
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-1 min-h-0">
      <div className={cn("flex flex-col min-h-0  min-w-0 transition-[width] duration-600 ease-in-out flex-1")}>
        {isMounting ? (
          <>
            <DayViewDayHeader currentDate={date} />
            <CalendarScrollContainerSkeleton
              hours={defaultHours}
              totalColumns={visibleRooms ? visibleRooms.length : 10}
            />
          </>
        ) : (
          <>
            <DayViewDayHeader currentDate={date} />
            <CalendarScrollContainerPrivate isLoading={isLoading} hours={result?.data.hours || defaultHours}>
              {roomsToRender?.map((room, roomIndex) => {
                return (
                  <CalendarScrollColumnPrivate
                    key={room.roomId}
                    loadingBlocks={isLoading}
                    title={room.roomName}
                    interval={interval}
                    roomId={room.roomId}
                    userId={userId}
                    hours={result?.data.hours || []}
                    eventBlocks={room.blocks || []}
                    isLastColumn={roomsToRender.length - 1 === roomIndex}
                    currentDate={date}
                  />
                );
              })}
            </CalendarScrollContainerPrivate>
          </>
        )}
      </div>
      <CalendarDayColumnCalendar
        date={date}
        isLoading={isLoading}
        events={events || []}
        view={"day"}
      ></CalendarDayColumnCalendar>
    </div>
  );
}
