"use client";

import { format, parse } from "date-fns";
import { usePrivateCalendar } from "@/contexts/CalendarProviderPrivate";

import { useEffect, useMemo, useRef, useState } from "react";

import { CalendarWeekViewSkeleton } from "./skeleton-calendar-week-view";
import { CalendarScrollContainerPrivate } from "../components/calendar-scroll-container";
import { CalendarScrollColumnPrivate } from "../components/calendar-scroll-column";

import { cn } from "@/lib/utils";
import { usePrivateCalendarEvents } from "../webworkers/use-calendar-private-events";
import { IEventBlock } from "../webworkers/generic-webworker";
import { CalendarScrollContainerSkeleton } from "../components/calendar-scroll-container-skeleton";

export function CalendarWeekView({ date, userId }: { date: Date; userId?: string }) {
  const { interval, visibleHours, defaultHours, visibleRooms, selectedRoomId, setIsHeaderLoading, setTotalEvents } =
    usePrivateCalendar();

  const roomIds = useMemo(
    () => (visibleRooms ? visibleRooms.map((room) => room.roomId.toString()) : []),
    [visibleRooms],
  );

  const { result, isLoading } = usePrivateCalendarEvents("WEEK", date, visibleHours, userId, selectedRoomId);

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

  //const lastRoomId = roomsToRender?.length ? roomsToRender[roomsToRender.length - 1].roomId : undefined;

  const { daysToRender } = useMemo(() => {
    if (!result?.data || result.action !== "WEEK") {
      return { daysToRender: [] };
    }

    const daysToRender = Array.from(result.data.dayBlocks.entries()).map(([dateKey, roomMap]) => {
      // roomMap is a Map<string, IEventBlock[]>

      let filteredRooms: [string, IEventBlock[]][];

      if (selectedRoomId === "-1") {
        // Only include the "-1" (All Rooms) entry
        const allRoomsEntry = roomMap.get("-1");
        filteredRooms = allRoomsEntry ? [["-1", allRoomsEntry]] : [];
      } else {
        // Only include the selected room
        const roomEntry = roomMap.get(selectedRoomId);
        filteredRooms = roomEntry ? [[selectedRoomId, roomEntry]] : [];
      }

      // Flatten blocks
      const flatBlocks = filteredRooms.flatMap(([_, blocks]) => blocks);

      return {
        date: dateKey,
        blocks: flatBlocks,
      };
    });

    return { daysToRender };
  }, [result, selectedRoomId]);

  const isMounting = !visibleRooms || !result || false;

  return (
    <>
      <div className="flex flex-1 min-h-0">
        <div className={cn("flex flex-col min-h-0  min-w-0 transition-[width] duration-600 ease-in-out flex-1")}>
          {isMounting ? (
            <>
              <CalendarScrollContainerSkeleton hours={defaultHours} totalColumns={7} interval={interval} />
            </>
          ) : (
            <CalendarScrollContainerPrivate isLoading={isLoading} hours={result?.data.hours || []}>
              {daysToRender.map((day, dayIndex) => {
                return (
                  <CalendarScrollColumnPrivate
                    key={day.date}
                    loadingBlocks={isLoading}
                    title={format(parse(day.date, "yyyy-MM-dd", new Date()), "EE d")}
                    interval={interval}
                    roomId={undefined}
                    userId={userId}
                    hours={result?.data.hours || []}
                    eventBlocks={day.blocks || []}
                    isLastColumn={daysToRender.length - 1 === dayIndex}
                    currentDate={parse(day.date, "yyyy-MM-dd", new Date())}
                  />
                );
              })}
            </CalendarScrollContainerPrivate>
          )}
          {/* 
              <>
                <div className="relative z-20 flex border-b">
                  <div className="w-18"></div>
                  <div className={`grid flex-1 grid-cols-${dayViews.length} divide-x border-l`}>
                    {dayViews.map((day) => {
                      return <WeekViewDayHeader key={day.day} dayView={day} />;
                    })}
                  </div>
                </div>
                <ScrollArea className="max-h-[50vh] md:max-h-[60vh] lg:max-h-[70vh] xl:max-h-[73vh]" type="always">
                  <div className="flex overflow-hidden">
                    
                    <HourColumn hours={hours} />

                    
                    <div className="relative flex-1 border-l">
                      <div className="grid grid-cols-7 divide-x">
                        {dayViews.map((day, dayIndex) => {
                          return (
                            <div key={dayIndex} className="relative">
                              <DayHourlyEventDialogs hours={hours} day={day.dayDate} userId={userId} />

                              {day.eventBlocks.map((block, blockIndex) => {
                                return (
                                  <div
                                    key={`day-${dayIndex}-block-${blockIndex}-event-${block.event.eventId}`}
                                    className="absolute p-1"
                                    style={block.eventStyle}
                                  >
                                    <EventBlock eventBlock={block} heightInPixels={block.eventHeight} userId={userId} />
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
                  <ScrollBar orientation="vertical" forceMount></ScrollBar>
                </ScrollArea>
              </>
              */}
        </div>
      </div>
    </>
  );
}
