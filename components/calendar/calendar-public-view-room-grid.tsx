"use client";

import { format, formatDate } from "date-fns";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";

import { useMemo, useState } from "react";

import { PUBLIC_IROOM } from "@/lib/services/public";
import { Button } from "../ui/button";

import { PublicEventBlock } from "./calendar-public-view-event-block";
import React from "react";
import { ChevronLeft, ChevronRight, LoaderCircle } from "lucide-react";
import { IEventList } from "./calendar-public-view";
import { CalendarDayPopover } from "../calendar-day-popover/calendar-day-popover";
import { navigateDate, navigateURL } from "@/lib/helpers";
import { useRouter } from "next/navigation";
import { CalendarPublicViewRoomGridSkeleton } from "./skeleton-calendar-public-view-room-grid";
import { Skeleton } from "../ui/skeleton";
import { PublicEventBlockHybrid } from "./calendar-public-view-event-block-hybrid";
import { TIME_BLOCK_SIZE } from "@/lib/types";

export const FilteredRoomGrid = React.memo(
  ({
    isLoading,
    filteredRooms,
    hours,
    eventBlocks,
    selectedDate,
    isSidebarOpen,
  }: {
    isLoading: boolean;
    filteredRooms: PUBLIC_IROOM[] | undefined;
    hours: number[] | undefined;
    eventBlocks: IEventList | undefined;
    selectedDate?: Date;
    isSidebarOpen?: boolean;
  }) => {
    const isMounting = !filteredRooms || !eventBlocks || !hours;

    const breakpoints = isSidebarOpen
      ? "w-(--public-calendar-sidebar-w-min) sm:w-(--public-calendar-sidebar-w-sm) lg:w-(--public-calendar-sidebar-w-lg) xl:w-(--public-calendar-sidebar-w-xl)"
      : "w-(--public-calendar-w-min) sm:w-(--public-calendar-w-sm) lg:w-(--public-calendar-w-lg)";

    return (
      <div className="flex-1 ">
        <div className={`${breakpoints} flex justify-center`}>
          <div className={`w-[calc(100%-10px)] flex justify-center  px-12  border-b py-4 mb-4`}>
            {isMounting ? (
              <DateControlSkeleton selectedDate={selectedDate || new Date()}></DateControlSkeleton>
            ) : (
              <DateControls selectedDate={selectedDate || new Date()}></DateControls>
            )}
          </div>
        </div>

        <div className={`${breakpoints} flex justify-center overflow-hidden h-[calc(100vh-200px)]`}>
          {isMounting ? (
            <CalendarPublicViewRoomGridSkeleton></CalendarPublicViewRoomGridSkeleton>
          ) : (
            <CalendarView
              isLoading={isLoading}
              eventBlocks={eventBlocks}
              filteredRooms={filteredRooms}
              hours={hours}
            ></CalendarView>
          )}
        </div>
      </div>
    );
  },
);

/*
{!filteredRooms.length || !eventBlocks || isLoading ? (
            <div>...Loading</div>
          ) : (
            <CalendarView eventBlocks={eventBlocks} filteredRooms={filteredRooms} hours={hours}></CalendarView>
          )}
*/

const CalendarView = ({
  isLoading,
  filteredRooms,
  hours,
  eventBlocks,
}: {
  isLoading: boolean;
  filteredRooms: PUBLIC_IROOM[];
  hours: number[];
  eventBlocks: IEventList | undefined;
}) => {
  const viewportRef = React.useRef<HTMLDivElement | null>(null);
  return (
    <ScrollArea className={`w-[calc(100%-10px)] h-[calc(100vh-220px)]`} type="always">
      {/* Header Row */}
      <div
        className="mx-6 mb-6"
        ref={(el) => {
          // Try to find the radix viewport inside this ScrollArea
          viewportRef.current = el?.querySelector("[data-radix-scroll-area-viewport]") as HTMLDivElement | null;
        }}
      >
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

                  {!isLoading &&
                    eventBlocks?.get(String(room.roomId))?.map((eventBlock) => {
                      return (
                        <div key={eventBlock.key} className="absolute p-1" style={eventBlock.eventStyle}>
                          <PublicEventBlockHybrid
                            viewportRef={viewportRef}
                            eventBlock={eventBlock}
                            heightInPixels={eventBlock.eventHeight}
                          ></PublicEventBlockHybrid>
                          {/*<PublicEventBlock
                            viewportRef={viewportRef}
                            eventBlock={eventBlock}
                            heightInPixels={eventBlock.eventHeight}
                          />*/}
                        </div>
                      );
                    })}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="flex bg-accent-foreground text-accent px-4 py-2 rounded ">
                  <LoaderCircle className="animate-spin" />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      <ScrollBar orientation="vertical" forceMount />
      <ScrollBar orientation="horizontal" forceMount />
    </ScrollArea>
  );
};

FilteredRoomGrid.displayName = "FilteredRoomGrid";

const RoomHourBlocks = ({ hours }: { hours: number[] }) => {
  const hourBlocks = useMemo(() => {
    return hours.map((hour, index) => (
      <div key={hour} className="relative" style={{ height: `${TIME_BLOCK_SIZE}px` }}>
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
        <div key={hour} className="relative" style={{ height: `${TIME_BLOCK_SIZE}px` }}>
          <div className={"absolute right-2 flex h-6 items-center " + (index !== 0 ? "-top-3" : "")}>
            <span className="text-xs text-muted-foreground">{format(new Date().setHours(hour), "hh a")}</span>
          </div>
        </div>
      ))}
    </div>
  );
});

HourColumn.displayName = "HourColumn";

const DateControls = ({ selectedDate }: { selectedDate: Date }) => {
  const { push } = useRouter();

  const [currentDate, setCurrentDate] = useState<Date>(selectedDate);

  const handleNavigatePrevious = () => {
    const previousDate = navigateDate(selectedDate, "day", "previous");
    setCurrentDate(previousDate);
    push(navigateURL(previousDate, "public"));
  };

  const handleNavigateNext = () => {
    const nextDate = navigateDate(selectedDate, "day", "next");
    setCurrentDate(nextDate);
    push(navigateURL(nextDate, "public"));
  };

  return (
    <div className="grid grid-cols-2 gap-2 auto-cols-min lg:grid-cols-[auto_minmax(10rem,1fr)_auto] w-full items-center min-w-65">
      {/* Label - spans both columns */}
      <div className="text-center justify-self-center col-span-2 lg:col-start-2 lg:col-span-1 lg:row-start-1">
        <CalendarDayPopover
          id={`}Date`}
          disabled={false}
          value={currentDate}
          onSelect={(selectedDate) => {
            if (!selectedDate) return;
            setCurrentDate(selectedDate);
            push(navigateURL(selectedDate, "public"));
          }}
          placeholder={formatDate(currentDate, "MMMM do, yyyy")}
          className="block text-base font-semibold w-40"
          data-invalid={false}
        >
          <Button size={"sm"} variant="ghost" className="block text-base font-semibold ">
            {<span>{formatDate(currentDate, "PPP")}</span>}
          </Button>
        </CalendarDayPopover>
      </div>

      {/* Previous Button */}
      <div className="justify-self-end lg:col-start-1">
        <Button className="w-30" size="sm" onClick={handleNavigatePrevious}>
          <ChevronLeft />
          Previous
        </Button>
      </div>

      {/* Next Button */}
      <div className="justify-self-start lg:col-start-3">
        <Button className="w-30" size="sm" onClick={handleNavigateNext}>
          Next
          <ChevronRight />
        </Button>
      </div>
    </div>
  );
};

export const DateControlSkeleton = ({ selectedDate }: { selectedDate: Date }) => {
  return (
    <div className="grid grid-cols-2 gap-2 auto-cols-min lg:grid-cols-[auto_minmax(10rem,1fr)_auto] w-full items-center min-w-65">
      <div className="text-center justify-self-center col-span-2 lg:col-start-2 lg:col-span-1 lg:row-start-1">
        <Skeleton className="w-45 h-8 inline-flex items-center justify-center text-base font-semibold ">
          {formatDate(selectedDate, "PPP")}
        </Skeleton>
      </div>
      <div className="justify-self-end lg:col-start-1">
        <Skeleton className="w-30 h-8"></Skeleton>
      </div>
      <div className="justify-self-start lg:col-start-3">
        <Skeleton className="w-30 h-8"></Skeleton>
      </div>
    </div>
  );
};
