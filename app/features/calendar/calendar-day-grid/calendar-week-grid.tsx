import { format } from "date-fns";
import React from "react";

import { cn } from "@/lib/utils";

import { IBlock } from "./calendar-day-grid-webworker";
import { IRoom } from "@/lib/schemas/calendar";
import { GridEventBlock } from "./calendar-day-grid-event-block";
import { useCalendarDayGrid } from "./calendar-day-grid-context";

import { CalendarDayViewSkeleton } from "@/app/features/calendar/view-day/skeleton-calendar-day-view";

import { useSharedEventDrawer } from "../../event-drawer/shared-event-drawer-context";
import { CalendarScrollContainer } from "../components/calendar-scroll-container";
import { CalendarScrollColumn } from "../components/calendar-scroll-column";

export const WeeklyBlocks = React.memo(function WeeklyBlocks({
  isLoading,
  selectedRoomId,
  visibleRooms,
  roomBlocks,
}: {
  isLoading: boolean;
  selectedRoomId: number;
  visibleRooms: IRoom[] | undefined;
  roomBlocks: Map<string, IBlock[]> | undefined;
}) {
  const { hours, currentDate, interval, userId } = useCalendarDayGrid();
  const roomsToRender = React.useMemo(
    () =>
      visibleRooms
        ?.filter((room) => selectedRoomId === -1 || room.roomId === selectedRoomId)
        .map((room) => {
          const blocks = roomBlocks?.get(String(room.roomId)) ?? [];
          return { roomId: room.roomId, roomName: room.name, blocks };
        }),
    [visibleRooms, selectedRoomId, roomBlocks],
  );

  const lastRoomId = roomsToRender?.length ? roomsToRender[roomsToRender.length - 1].roomId : undefined;

  const isMounting = !visibleRooms || !roomBlocks || !hours;

  return (
    <CalendarScrollContainer
      isLoading={isLoading}
      hours={hours || []}
      isMounting={isMounting}
      skeleton={<CalendarDayViewSkeleton hours={hours} />}
    >
      {roomsToRender?.map((room) => {
        return (
          <CalendarScrollColumn
            key={room.roomId}
            loadingBlocks={isLoading}
            title={room.roomName}
            interval={interval}
            roomId={room.roomId}
            userId={userId}
            hours={hours || []}
            eventBlocks={room.blocks || []}
            isLastColumn={room.roomId === lastRoomId}
            currentDate={currentDate}
          />
        );
      })}
    </CalendarScrollContainer>
  );
});
