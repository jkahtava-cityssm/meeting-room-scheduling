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
import { LucideCalendarDays, Terminal } from "lucide-react";
import { GenericError } from "../../../../components/shared/generic-error";
import { vi } from "date-fns/locale";
import { TStatusKey } from "@/lib/types";
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";

export function CalendarDayView({
  date,
  userId,
  isSidebarOpen = false,
}: {
  date: Date;
  userId?: string;
  isSidebarOpen?: boolean;
}) {
  // const { can } = CalendarPermissions.usePermissions();
  const {
    interval,
    maxSpan,
    visibleHours,
    fallbackHours,
    visibleRooms,
    selectedRoomIds,
    selectedStatusKeys,
    configurationError,
    roomError,
    setIsHeaderLoading,
    setTotalEvents,
  } = usePrivateCalendar();

  const roomIds = useMemo(
    () => (visibleRooms ? visibleRooms.map((room) => room.roomId.toString()) : []),
    [visibleRooms],
  );

  const { result, isLoading, error } = usePrivateCalendarEvents(
    "DAY",
    date,
    visibleHours,
    userId,
    roomIds,
    selectedStatusKeys,
  );

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
        ?.filter((room) => selectedRoomIds.includes("-1") || selectedRoomIds.includes(String(room.roomId)))
        .map((room) => {
          const blocks = result?.data.roomBlocks[String(room.roomId)] ?? [];
          return { roomId: room.roomId, roomName: room.name, blocks };
        }) ?? []; // Flatten all events from all blocks
    const events = rooms.flatMap(
      (room) => room.blocks.map((block) => block.event).filter(Boolean), // remove null/undefined
    );

    return { roomsToRender: rooms, events };
  }, [visibleRooms, selectedRoomIds, result]);

  useEffect(() => {
    setTotalEvents(events.length);
  }, [events, setTotalEvents]);

  const isMounting = !visibleRooms || !result;

  /*if (error || configurationError || roomError) {
    return <GenericError error={error || configurationError || roomError} />;
  }*/

  const noRoomData = roomsToRender.length === 0;

  return (
    <div className="flex flex-1 min-h-0">
      <div className={cn("flex flex-col min-h-0  min-w-0 transition-[width] duration-600 ease-in-out flex-1")}>
        {isMounting ? (
          <>
            <DayViewDayHeader currentDate={date} />
            <CalendarScrollContainerSkeleton
              hours={fallbackHours}
              totalColumns={visibleRooms ? visibleRooms.length : 10}
            />
          </>
        ) : (
          <>
            <DayViewDayHeader currentDate={date} />
            <CalendarScrollContainerPrivate isLoading={isLoading} hours={result?.data.hours}>
              {noRoomData ? (
                <div className="flex flex-1 flex-col  p-4">
                  <Empty className="border border-dashed flex flex-1 flex-col">
                    <EmptyHeader>
                      <EmptyMedia>
                        <LucideCalendarDays />
                      </EmptyMedia>
                      <EmptyTitle>No Room Selected</EmptyTitle>
                      <EmptyDescription>
                        {error
                          ? error.message
                          : configurationError
                            ? configurationError.message
                            : noRoomData
                              ? "Please choose a room from the dropdown"
                              : "Unknown Cause"}
                      </EmptyDescription>
                    </EmptyHeader>
                    <EmptyContent>{roomError && <GenericError error={roomError} />}</EmptyContent>
                  </Empty>
                </div>
              ) : (
                roomsToRender?.map((room, roomIndex) => {
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
                      maxHour={visibleHours ? visibleHours.to : 24}
                      minHour={visibleHours ? visibleHours.from : 0}
                      maxSpan={maxSpan}
                    />
                  );
                })
              )}
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
