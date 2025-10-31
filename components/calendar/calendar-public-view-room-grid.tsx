"use client";

import { format, formatDate } from "date-fns";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";

import { useMemo, useState } from "react";

import { PUBLIC_IROOM } from "@/services/public";
import { Button } from "../ui/button";

import { PublicEventBlock } from "./calendar-public-view-event-block";
import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { IEventList } from "./calendar-public-view";
import { SingleDayPicker } from "../ui/single-day-picker";
import { navigateDate, navigateURL } from "@/lib/helpers";
import { useRouter } from "next/navigation";

export const FilteredRoomGrid = React.memo(
  ({
    isLoading,
    filteredRooms,
    hours,
    eventBlocks,
    selectedDate,
  }: {
    isLoading: boolean;
    filteredRooms: PUBLIC_IROOM[];
    hours: number[];
    eventBlocks: IEventList | undefined;
    selectedDate?: Date;
  }) => {
    return (
      <div className="flex-1 ">
        <div
          className={`w-(--public-calendar-w-min) sm:w-(--public-calendar-w-sm) lg:w-(--public-calendar-w-lg) flex justify-center`}
        >
          <div className={`w-[calc(100%-10px)] flex justify-center  px-12  border-b py-4 mb-4`}>
            <DateControls selectedDate={selectedDate || new Date()}></DateControls>
          </div>
        </div>

        <div
          className={` w-(--public-calendar-w-min) sm:w-(--public-calendar-w-sm) lg:w-(--public-calendar-w-lg) flex justify-center overflow-hidden h-[calc(100vh-200px)]`}
        >
          <CalendarView eventBlocks={eventBlocks} filteredRooms={filteredRooms} hours={hours}></CalendarView>
        </div>
      </div>
    );
  }
);

/*
{!filteredRooms.length || !eventBlocks || isLoading ? (
            <div>...Loading</div>
          ) : (
            <CalendarView eventBlocks={eventBlocks} filteredRooms={filteredRooms} hours={hours}></CalendarView>
          )}
*/

const CalendarView = ({
  filteredRooms,
  hours,
  eventBlocks,
}: {
  filteredRooms: PUBLIC_IROOM[];
  hours: number[];
  eventBlocks: IEventList | undefined;
}) => {
  return (
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

                  {eventBlocks?.get(String(room.roomId))?.map((eventBlock) => {
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
  );
};

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
        <SingleDayPicker
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
        </SingleDayPicker>
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
