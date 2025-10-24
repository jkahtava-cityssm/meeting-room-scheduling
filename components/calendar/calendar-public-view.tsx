"use client";

import { startOfWeek, endOfWeek, parse, format } from "date-fns";
import { useCalendar } from "@/contexts/CalendarProvider";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { CalendarTimeline } from "@/components/calendar/calendar-day-timeline";

import { DayHourlyEventDialogs } from "./calendar-day-event-block-add-hour-block";
import { HourColumn } from "./calendar-day-column-hourly";
import { WeekViewDayHeader } from "./calendar-week-view-day-header";
import { EventBlock } from "./calendar-day-event-block";
import { useEffect, useMemo, useRef, useState } from "react";

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

export interface IPublicProcessData {
  events: PUBLIC_IEVENT[];
  selectedDate: Date;
  roomIdList: string[];
  pixelHeight: number;
  visibleHours: TVisibleHours;
  multiDayEventsAtTop: boolean;
}

export interface IPublicResponseData {
  totalEvents: number;
  dayViews: IDayView[];
  hours: number[];
  //weekViews: WeekView[];
}

export interface IDayView {
  day: number;
  dayDate: Date;
  isToday: boolean;
  eventBlocks: Map<string, IEventBlock[]>;
}

export interface IEventBlock {
  groupIndex: number;
  eventIndex: number;
  eventStyle: { top: string; width: string; left: string };
  eventHeight: number;
  event: IEvent;
}

function getViewDate(dateParam: string | null) {
  return dateParam === null ? removeTimeFromDate(new Date()) : parse(dateParam, "yyyy-MM-dd", new Date());
}

function removeTimeFromDate(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export function CalendarPublicView() {
  const searchParams = useSearchParams();
  const dateParam = searchParams.get("selectedDate");

  const dateValue = useMemo(() => {
    return getViewDate(dateParam);
  }, [dateParam]);

  const [isLoading, setLoading] = useState(true);
  const [isRefreshed, setRefreshed] = useState(false);
  const [dayViews, setDayViews] = useState<IDayView[]>([]);
  const [data, setData] = useState([]);
  const [hours, setHours] = useState<number[]>([]);

  const { workingHours, visibleHours, setIsHeaderLoading, setTotalEvents } = useCalendar();

  const workerRef = useRef<Worker | null>(null);

  const startDate: Date = startOfWeek(dateValue);
  const endDate: Date = endOfWeek(dateValue);

  const { data: events } = usePublicEventsQuery(startDate, endDate);

  const { data: rooms } = usePublicRoomsQuery();

  const [selectedRoomIds, setSelectedRoomIds] = useState<number[]>([]);

  useEffect(() => {
    //The Workerthread needs to be recreated when we navigate back to the page if the params havent changed.
    //nextjs cache's the route so this is my temporary fix
    setRefreshed(true);
  }, []);

  useEffect(() => {
    setLoading(true);
  }, [dateValue]);

  useEffect(() => {
    //This is mostly as an example for myself, technically this processing should likely be done on the server side.
    //But this example will come in handy for other applications

    if (workerRef.current) {
      return;
    }

    const newWorker = new Worker(new URL("./webworkers/calendar-public-webworker.ts", import.meta.url));

    newWorker.onmessage = (result) => {
      setData(result.data);
      setDayViews(result.data.dayViews);
      setHours(result.data.hours);
      //setTotalEvents(result.totalEvents);
      setIsHeaderLoading(false);
      setLoading(false);
    };

    workerRef.current = newWorker;

    return () => {
      if (workerRef.current) {
        workerRef.current.terminate();
        workerRef.current = null;
      }
    };
  }, [dateValue, setIsHeaderLoading, setTotalEvents]);

  useEffect(() => {
    if (!events || !rooms) {
      return;
    }

    if (workerRef.current) {
      const data: IPublicProcessData = {
        events: events,
        visibleHours: visibleHours,
        selectedDate: dateValue,
        roomIdList: rooms.map((room) => room.roomId.toString()),
        multiDayEventsAtTop: true,
        pixelHeight: 96,
      };
      //setLoading(true);
      setIsHeaderLoading(true);

      workerRef.current.postMessage(data);
    }
  }, [events, dateValue, isRefreshed, rooms, setIsHeaderLoading, visibleHours]);

  if (isLoading || !rooms || !events) {
    return <CalendarWeekViewSkeleton />;
  }

  if (rooms || events) {
    <div>...</div>;
  }

  const handleCheckedRoomsChange = (checkedIds: number[]) => {
    setSelectedRoomIds(checkedIds);
    // You can also trigger other side effects here
  };

  return (
    <>
      <div className="flex flex-col items-center justify-center border-b py-4 text-sm text-muted-foreground sm:hidden">
        <p>Weekly view is not available on smaller devices.</p>
        <p>Please switch to daily or monthly view.</p>
      </div>
      <div className="flex flex-col ">
        <div className="flex">
          <div className="mr-4 w-[500px]">
            <p className="text-sm text-muted-foreground">This is your calendar overview or instructions.</p>
            <RoomCategoryLayout rooms={rooms} onCheckedRoomsChange={handleCheckedRoomsChange}></RoomCategoryLayout>
          </div>

          <div className="flex-1 overflow-hidden w-150 h-150">
            <ScrollArea className="w-140 h-140" type="always">
              {/* Header Row */}
              <div className="mx-6 mb-6">
                <div className="flex h-[60px] w-full border-y-2  sticky top-0 z-10 bg-background">
                  <div className="w-18 border-x-2 flex items-center justify-end pr-2">
                    <span className="py-2 text-center text-xs font-medium text-muted-foreground">
                      <span className="ml-1 font-semibold text-foreground">Time</span>
                    </span>
                  </div>

                  {rooms.map((room) => (
                    <div key={room.roomId} className="w-45 border-r-2 flex items-center  justify-center">
                      <span key={room.roomId} className="py-2 text-center text-xs font-medium text-muted-foreground">
                        <span className="ml-1 font-semibold text-foreground">{room.name}</span>
                      </span>
                    </div>
                  ))}
                </div>
                <div className="flex ">
                  <div className="min-w-18 border-x-2  pr-2  border-b-2">
                    {hours.map((hour, index) => (
                      <div key={hour} className="relative" style={{ height: "96px" }}>
                        <div className={"absolute  right-2 flex h-6 items-center " + (index !== 0 ? "-top-3" : "")}>
                          <span className="text-xs text-muted-foreground">
                            {format(new Date().setHours(hour), "hh a")}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="flex w-full border-b-2">
                    {rooms.map((room) => (
                      <div key={room.roomId}>
                        <div className="w-45 relative border-r border-dashed">
                          {hours.map((hour, index) => (
                            <div
                              key={hour}
                              className={cn("relative", false && "bg-calendar-disabled-hour")}
                              style={{ height: "96px" }}
                            >
                              {index !== 0 && (
                                <div className="pointer-events-none absolute inset-x-0 top-0 border-b-2" />
                              )}
                              <div className="absolute inset-x-0 top-0 h-6 cursor-pointer transition-colors hover:bg-accent" />
                              <div className="absolute inset-x-0 top-6 h-6 cursor-pointer transition-colors hover:bg-accent" />
                              <div className="pointer-events-none absolute inset-x-0 top-1/2 border-b border-dashed" />
                              <div className="absolute inset-x-0 top-12 h-6 cursor-pointer transition-colors hover:bg-accent" />
                              <div className="absolute inset-x-0 top-[72px] h-6 cursor-pointer transition-colors hover:bg-accent" />
                            </div>
                          ))}
                          {Array.from(dayViews[0].eventBlocks.entries()).flatMap(([roomId, blocks]) =>
                            blocks.map((block, eventIndex) => {
                              if (block.event.roomId !== room.roomId) return null;
                              return (
                                <div
                                  key={`day-${dayViews[0].day}-block-${format(
                                    block.event.startDate,
                                    "yyyy-MM-dd-HH-mm"
                                  )}-event-${block.event.eventId}`}
                                  className="absolute p-1"
                                  style={block.eventStyle}
                                >
                                  <PublicEventBlock
                                    eventBlock={block}
                                    heightInPixels={block.eventHeight}
                                  ></PublicEventBlock>
                                </div>
                              );
                            })
                          )}
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
      </div>
    </>
  );
}

{
  /*
  
  <div className="hidden flex-col sm:flex">
        <div className="flex">
          <div className="mr-4 w-[400px] flex-shrink-0">
            <p className="text-sm text-muted-foreground">

              This is your calendar overview or instructions.
            </p>
          </div>


          <div className="flex-1 overflow-hidden max-h-[50vh] md:max-h-[60vh] lg:max-h-[70vh] xl:max-h-[73vh]">
          
            <div className="flex  h-[48px] overflow-hidden">

              <div className="w-18 border-r-2 flex items-center justify-end right-2">
                <span className="py-2 text-center text-xs font-medium text-muted-foreground ">
                  <span className="ml-1 font-semibold text-foreground">Time</span>
                </span>
              </div>


              <div
                className="grid flex-1"
                style={{
                  gridTemplateColumns: `repeat(${rooms.length}, minmax(0, 1fr))`,
                }}
              >
                {rooms.map((room) => (
                  <span
                    key={room.roomId}
                    className="py-2 text-center text-xs font-medium text-muted-foreground border-b-2"
                  >
                    <span className="ml-1 font-semibold text-foreground">{room.name}</span>
                  </span>
                ))}
              </div>
            </div>


            <ScrollArea style={{ height: "calc(100% - 48px)" }} type="always">
              <div className="flex">
                <div className="w-18 border-r-2">
                  {hours.map((hour, index) => (
                    <div key={hour} className="relative" style={{ height: "96px" }}>
                      <div className="absolute -top-3 right-2 flex h-6 items-center">
                        {index !== 0 && (
                          <span className="text-xs text-muted-foreground">
                            {format(new Date().setHours(hour), "hh a")}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                <div
                  className="grid flex-1"
                  style={{
                    gridTemplateColumns: `repeat(${rooms.length}, minmax(0, 1fr))`,
                  }}
                >
                  {rooms.map((room) => (
                    <div key={room.roomId}>
                      <div className="relative border-r-1 border-dashed">
                        {hours.map((hour, index) => (
                          <div
                            key={hour}
                            className={cn("relative", false && "bg-calendar-disabled-hour")}
                            style={{ height: "96px" }}
                          >
                            {index !== 0 && <div className="pointer-events-none absolute inset-x-0 top-0 border-b-2" />}
                            <div className="absolute inset-x-0 top-0 h-[24px] cursor-pointer transition-colors hover:bg-accent" />
                            <div className="absolute inset-x-0 top-6 h-[24px] cursor-pointer transition-colors hover:bg-accent" />
                            <div className="pointer-events-none absolute inset-x-0 top-1/2 border-b border-dashed" />
                            <div className="absolute inset-x-0 top-[48px] h-[24px] cursor-pointer transition-colors hover:bg-accent" />
                            <div className="absolute inset-x-0 top-[72px] h-[24px] cursor-pointer transition-colors hover:bg-accent" />
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <ScrollBar orientation="vertical" forceMount></ScrollBar>
            </ScrollArea>
          </div>
        </div>
      </div>
  */
}
