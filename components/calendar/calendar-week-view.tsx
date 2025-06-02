"use client";

import { startOfWeek, isSameDay, endOfWeek } from "date-fns";
import { useCalendar } from "@/contexts/CalendarProvider";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { CalendarTimeline } from "@/components/calendar/calendar-day-timeline";

import { DayHourlyEventDialogs } from "./calendar-day-event-block-add-hour-block";
import { HourColumn } from "./calendar-day-column-hourly";
import { WeekViewDayHeader } from "./calendar-week-view-day-header";
import { EventBlock } from "./calendar-day-event-block";
import { useEffect, useRef, useState } from "react";

import { CalendarWeekViewSkeleton } from "./skeleton-calendar-week-view";
import useSWR from "swr";
import { IEvent } from "@/lib/schemas/schemas";
import { TVisibleHours } from "@/lib/types";

export interface WeekProcessData {
  events: IEvent[];
  selectedDate: Date;
  selectedRoomId: string;
  pixelHeight: number;
  visibleHours: TVisibleHours;
  multiDayEventsAtTop: boolean;
}

export interface WeekResponseData {
  totalEvents: number;
  events: IEvent[];
  dayViews: DayView[];
  hours: number[];
  //weekViews: WeekView[];
}

export interface DayView {
  day: number;
  dayDate: Date;
  isToday: boolean;
  eventBlocks: EventBlock[];
}

export interface EventBlock {
  groupIndex: number;
  eventIndex: number;
  eventStyle: { top: string; width: string; left: string };
  eventHeight: number;
  event: IEvent;
}

export function CalendarWeekView({ date }: { date: Date }) {
  const [isLoading, setLoading] = useState(true);
  const [isRefreshed, setRefreshed] = useState(false);
  const [dayViews, setDayViews] = useState<DayView[]>([]);
  const [hours, setHours] = useState<number[]>([]);

  const { workingHours, visibleHours, selectedRoomId, setIsHeaderLoading, setTotalEvents } = useCalendar();

  const workerRef = useRef<Worker | null>(null);

  const startDate: Date = startOfWeek(date);
  const endDate: Date = endOfWeek(date);
  const { data: events } = useSWR<IEvent[]>(
    `/api/calendar?startdate=${startDate.toISOString()}&enddate=${endDate.toISOString()}`
  );

  useEffect(() => {
    //The Workerthread needs to be recreated when we navigate back to the page if the params havent changed.
    //nextjs cache's the route so this is my temporary fix
    setRefreshed(true);
  }, []);

  useEffect(() => {
    //This is mostly as an example for myself, technically this processing should likely be done on the server side.
    //But this example will come in handy for other applications

    if (workerRef.current) {
      return;
    }

    const newWorker = new Worker(new URL("./calendar-week-webworker.ts", import.meta.url));

    newWorker.onmessage = (event: MessageEvent<WeekResponseData>) => {
      setDayViews(event.data.dayViews);
      setHours(event.data.hours);
      setTotalEvents(event.data.totalEvents);
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
  }, [date, setIsHeaderLoading, setTotalEvents]);

  useEffect(() => {
    if (!events) {
      return;
    }

    if (workerRef.current) {
      const data: WeekProcessData = {
        events: events,
        visibleHours: visibleHours,
        selectedDate: date,
        selectedRoomId: selectedRoomId,
        multiDayEventsAtTop: true,
        pixelHeight: 96,
      };
      setLoading(true);
      setIsHeaderLoading(true);

      workerRef.current.postMessage(data);
    }
  }, [events, date, selectedRoomId, isRefreshed, setIsHeaderLoading, visibleHours]);

  if (isLoading) {
    return <CalendarWeekViewSkeleton />;
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
            {isLoading ? (
              <CalendarWeekViewSkeleton />
            ) : (
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
                    {/* Hours column */}
                    <HourColumn hours={hours} />

                    {/* Week grid */}
                    <div className="relative flex-1 border-l">
                      <div className="grid grid-cols-7 divide-x">
                        {dayViews.map((day, dayIndex) => {
                          return (
                            <div key={dayIndex} className="relative">
                              <DayHourlyEventDialogs hours={hours} day={day.dayDate} workingHours={workingHours} />

                              {day.eventBlocks.map((block, blockIndex) => {
                                return (
                                  <div
                                    key={`day-${dayIndex}-block-${blockIndex}-event-${block.event.eventId}`}
                                    className="absolute p-1"
                                    style={block.eventStyle}
                                  >
                                    <EventBlock
                                      eventBlock={block}
                                      heightInPixels={block.eventHeight}
                                      fetchData={async () => {}}
                                    />
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
            )}
          </div>
        </div>
      </div>
    </>
  );
}
