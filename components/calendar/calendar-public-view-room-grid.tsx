"use client";

import { startOfWeek, endOfWeek, parse, format, formatDate } from "date-fns";
import { useCalendar } from "@/contexts/CalendarProvider";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { CalendarTimeline } from "@/components/calendar/calendar-day-timeline";

import { DayHourlyEventDialogs } from "./calendar-day-event-block-add-hour-block";
import { WeekViewDayHeader } from "./calendar-week-view-day-header";
import { EventBlock } from "./calendar-day-event-block";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { CalendarWeekViewSkeleton } from "./skeleton-calendar-week-view";
import { IEvent } from "@/lib/schemas/calendar";
import { colorOptions, TColors, TVisibleHours } from "@/lib/types";
import { PUBLIC_IEVENT, PUBLIC_IROOM, usePublicEventsQuery, usePublicRoomsQuery } from "@/services/public";
import { useSearchParams } from "next/navigation";
import { useRoomsQuery } from "@/services/rooms";
import { Button } from "../ui/button";
import Link from "next/link";
import { Skeleton } from "../ui/skeleton";
import { Label } from "../ui/label";
import { getVisibleHours } from "@/lib/helpers";
import { cn } from "@/lib/utils";
import { PublicEventBlock, PublicEventCard } from "./calendar-public-view-event-block";
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip";
import { Checkbox } from "../ui/checkbox";
import RoomCategoryLayout from "./calendar-public-view-room-list";
import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { IEventBlock, IEventList } from "./calendar-public-view";

const XL_BREAKPOINT = 300;
const LG_BREAKPOINT = 300;
const MD_BREAKPOINT = 300;
const SM_BREAKPOINT = 300;
const XS_BREAKPOINT = 300;
const XXS_BREAKPOINT = 50;

export const FilteredRoomGrid = React.memo(
  ({
    filteredRooms,
    hours,
    eventBlocks,
  }: {
    filteredRooms: PUBLIC_IROOM[];
    hours: number[];
    eventBlocks: IEventList | undefined;
  }) => {
    if (!filteredRooms.length || !eventBlocks) return null;
    //w-100 xs:w-140 sm:w-120 md:w-170 lg:w-180 xl:w-240 2xl:w-300

    return (
      <div className="flex-1 ">
        <div
          className={`w-(--public-calendar-w-min) sm:w-(--public-calendar-w-sm) lg:w-(--public-calendar-w-lg) flex justify-center`}
        >
          <div className={`w-[calc(100%-10px)] flex justify-center  px-12  border-b py-4 mb-4`}>
            <DateControls></DateControls>
          </div>
        </div>

        <div
          className={` w-(--public-calendar-w-min) sm:w-(--public-calendar-w-sm) lg:w-(--public-calendar-w-lg) flex justify-center overflow-hidden h-[calc(100vh-200px)]`}
        >
          <ScrollArea className={`w-[calc(100%-10px)] h-[calc(100vh-220px)]`} type="always">
            {/* Header Row */}
            <div className="mx-6 mb-6">
              <div className="flex h-[60px] w-full border-y-2 sticky top-0 z-10 bg-background">
                <div className="w-18 border-x-2 flex items-center justify-end pr-2">
                  <span className="py-2 text-center text-xs font-medium text-muted-foreground">
                    <span className="ml-1 font-semibold text-foreground">Time</span>
                  </span>
                </div>
                {filteredRooms.map((room) => (
                  <div key={room.roomId} className="w-45 border-r-2 flex items-center justify-center">
                    <span className="py-2 text-center text-xs font-medium text-muted-foreground">
                      <span className="ml-1 font-semibold text-foreground">{room.name}</span>
                    </span>
                  </div>
                ))}
              </div>

              {/* Time Rows */}
              <div className="flex">
                <HourColumn hours={hours}></HourColumn>

                {/* Room Columns */}
                <div className="flex w-full border-b-2">
                  {filteredRooms.map((room) => (
                    <div key={room.roomId}>
                      <div className="w-45 relative border-r border-dashed">
                        <RoomHourBlocks hours={hours} />

                        {eventBlocks.get(String(room.roomId))?.map((eventBlock) => {
                          return (
                            <div key={eventBlock.key} className="absolute p-1" style={eventBlock.eventStyle}>
                              <PublicEventBlock eventBlock={eventBlock} heightInPixels={eventBlock.eventHeight} />
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <ScrollBar orientation="vertical" forceMount />
            <ScrollBar orientation="horizontal" forceMount />
          </ScrollArea>
        </div>
      </div>
    );
  }
);

FilteredRoomGrid.displayName = "FilteredRoomGrid";

const RoomHourBlocks = ({ hours }: { hours: number[] }) => {
  const hourBlocks = useMemo(() => {
    console.log("Rendering RoomHourBlocks");
    return hours.map((hour, index) => (
      <div key={hour} className="relative" style={{ height: "96px" }}>
        {index !== 0 && <div className="pointer-events-none absolute inset-x-0 top-0 border-b-2" />}
        <div className="absolute inset-x-0 top-0 h-6 cursor-pointer transition-colors hover:bg-accent" />
        <div className="absolute inset-x-0 top-6 h-6 cursor-pointer transition-colors hover:bg-accent" />
        <div className="pointer-events-none absolute inset-x-0 top-1/2 border-b border-dashed" />
        <div className="absolute inset-x-0 top-12 h-6 cursor-pointer transition-colors hover:bg-accent" />
        <div className="absolute inset-x-0 top-[72px] h-6 cursor-pointer transition-colors hover:bg-accent" />
      </div>
    ));
  }, [hours]);

  return <>{hourBlocks}</>;
};

const HourColumn = React.memo(({ hours }: { hours: number[] }) => {
  return (
    <div className="min-w-18 border-x-2 pr-2 border-b-2">
      {hours.map((hour, index) => (
        <div key={hour} className="relative" style={{ height: "96px" }}>
          <div className={"absolute right-2 flex h-6 items-center " + (index !== 0 ? "-top-3" : "")}>
            <span className="text-xs text-muted-foreground">{format(new Date().setHours(hour), "hh a")}</span>
          </div>
        </div>
      ))}
    </div>
  );
});

HourColumn.displayName = "HourColumn";

const DateControls = () => {
  return (
    <div className="grid grid-cols-2 gap-2 auto-cols-min lg:grid-cols-[auto_minmax(10rem,1fr)_auto] w-full items-center min-w-65">
      {/* Label - spans both columns */}
      <div className="text-center min-w-40 col-span-2 lg:col-start-2 lg:col-span-1 lg:row-start-1">
        <Label className="block text-base font-semibold">{formatDate(new Date(), "MMMM do, yyyy")}</Label>
      </div>

      {/* Previous Button */}
      <div className="justify-self-end lg:col-start-1">
        <Button className="w-30" size="sm">
          <ChevronLeft />
          Previous
        </Button>
      </div>

      {/* Next Button */}
      <div className="justify-self-start lg:col-start-3">
        <Button className="w-30" size="sm">
          Next
          <ChevronRight />
        </Button>
      </div>
    </div>
  );
};
