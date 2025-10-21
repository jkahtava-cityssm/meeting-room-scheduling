"use client";

import { startOfWeek, endOfWeek, parse } from "date-fns";
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
import { TVisibleHours } from "@/lib/types";
import { usePublicEventsQuery, usePublicRoomsQuery } from "@/services/public";
import { useSearchParams } from "next/navigation";
import { useRoomsQuery } from "@/services/rooms";
import { Button } from "../ui/button";
import Link from "next/link";
import { Skeleton } from "../ui/skeleton";
import { Label } from "../ui/label";
import { getVisibleHours, isWorkingHour } from "@/lib/helpers";
import { cn } from "@/lib/utils";

export interface IWeekProcessData {
  events: IEvent[];
  selectedDate: Date;
  selectedRoomId: string;
  pixelHeight: number;
  visibleHours: TVisibleHours;
  multiDayEventsAtTop: boolean;
}

export interface IWeekResponseData {
  totalEvents: number;
  dayViews: IDayView[];
  hours: number[];
  //weekViews: WeekView[];
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

  const { workingHours, visibleHours, selectedRoomId, setIsHeaderLoading, setTotalEvents } = useCalendar();

  const workerRef = useRef<Worker | null>(null);

  const startDate: Date = startOfWeek(dateValue);
  const endDate: Date = endOfWeek(dateValue);

  const { data: events } = usePublicEventsQuery(startDate, endDate);

  const { data: rooms } = usePublicRoomsQuery();

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
      //setDayViews(result.dayViews);
      setHours(Array.from({ length: 24 }, (_, i) => i + 0));
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
    if (!events) {
      return;
    }

    if (workerRef.current) {
      const data: IWeekProcessData = {
        events: events,
        visibleHours: visibleHours,
        selectedDate: dateValue,
        selectedRoomId: selectedRoomId,
        multiDayEventsAtTop: true,
        pixelHeight: 96,
      };
      //setLoading(true);
      setIsHeaderLoading(true);

      workerRef.current.postMessage(data);
    }
  }, [events, dateValue, selectedRoomId, isRefreshed, setIsHeaderLoading, visibleHours]);

  if (isLoading) {
    return <CalendarWeekViewSkeleton />;
  }

  if (rooms || events) {
    <div>...</div>;
  }

  return (
    <>
      <div className="flex flex-col items-center justify-center border-b py-4 text-sm text-muted-foreground sm:hidden">
        <p>Weekly view is not available on smaller devices.</p>
        <p>Please switch to daily or monthly view.</p>
      </div>

      <div className="hidden flex-col sm:flex">
        <div className="flex">
          <div className="flex flex-1 flex-col">
            <table>
              <thead>
                <tr>
                  <th>HOUR</th>
                  {rooms?.map((room) => (
                    <th key={room.roomId}>
                      <span className="py-2 text-center text-xs font-medium text-muted-foreground">{room.name}</span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {hours.map((hour, index) => (
                  <tr key={`row-${index}`}>
                    <th>{hour}</th>
                    {rooms?.map((room) => (
                      <td key={`${hour}-${room.roomId}`}>{/* Your cell content here */}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
            {/*
                <div className={`grid [grid-template-columns:repeat(${rooms.length},minmax(0,1fr))] gap-4`}>
              {rooms?.map((room) => (
                <span key={room.roomId} className="py-2 text-center text-xs font-medium text-muted-foreground">
                  <span className="ml-1 font-semibold text-foreground">{room.name}</span>
                </span>
              ))}
            </div>*/}

            <ScrollArea className="max-h-[50vh] md:max-h-[60vh] lg:max-h-[70vh] xl:max-h-[73vh]" type="always">
              <div className="flex overflow-hidden">
                {/* Hours column */}
                <HourColumn hours={hours} />

                {/* Week grid */}
                <div className="relative flex-1 border-l">
                  <div className="grid grid-cols-7 divide-x">
                    <div className="relative">
                      <DayHourlyEventDialogs
                        hours={hours}
                        day={startDate}
                        workingHours={workingHours}
                        userId={undefined}
                      />
                    </div>

                    {dayViews.map((day, dayIndex) => {
                      return (
                        <div key={dayIndex} className="relative">
                             { hours.map((hour, index) => {
                                    const isDisabled = !isWorkingHour(day, hour, workingHours);
                                
                                    return (
                                      <div key={hour} className={cn("relative", isDisabled && "bg-calendar-disabled-hour")} style={{ height: "96px" }}>
                                        {index !== 0 && <div className="pointer-events-none absolute inset-x-0 top-0 border-b"></div>}
                                
                                        
                                          <div className="absolute inset-x-0 top-0 h-[24px] cursor-pointer transition-colors hover:bg-accent" />
                                        
                                
                                        
                                          <div className="absolute inset-x-0 top-[24px] h-[24px] cursor-pointer transition-colors hover:bg-accent" />
                                        
                                
                                        <div className="pointer-events-none absolute inset-x-0 top-1/2 border-b border-dashed"></div>
                                
                                        
                                          <div className="absolute inset-x-0 top-[48px] h-[24px] cursor-pointer transition-colors hover:bg-accent" />
                                        
                                
                                        
                                          <div className="absolute inset-x-0 top-[72px] h-[24px] cursor-pointer transition-colors hover:bg-accent" />
                                        
                                      </div>
                                    );
                                  });
                            }


                          {day.eventBlocks.map((block, blockIndex) => {
                            return (
                              <div
                                key={`day-${dayIndex}-block-${blockIndex}-event-${block.event.eventId}`}
                                className="absolute p-1"
                                style={block.eventStyle}
                              >
                                <EventBlock eventBlock={block} heightInPixels={block.eventHeight} userId={undefined} />
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
          </div>
        </div>
      </div>
    </>
  );
}
