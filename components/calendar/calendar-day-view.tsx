"use client";

import { Calendar, Clock, User } from "lucide-react";
import { format, addYears, startOfDay, endOfDay } from "date-fns";
import { useCalendar } from "@/contexts/CalendarProvider";
import { ScrollArea } from "@/components/ui/scroll-area";
import { SingleCalendar } from "@/components/ui/single-calendar";
import { CalendarTimeline } from "@/components/calendar/calendar-day-timeline";

import { DayHourlyEventDialogs } from "./calendar-day-event-block-add-hour-block";
import { HourColumn } from "./calendar-day-column-hourly";
import { DayViewDayHeader } from "./calendar-day-view-day-header";
import { EventBlock } from "./calendar-day-event-block";
import { useEffect, useRef, useState } from "react";

import { CalendarDayViewSkeleton } from "./skeleton-calendar-day-view";
import { IEvent } from "@/lib/schemas/schemas";
import { TVisibleHours } from "@/lib/types";
import useSWR from "swr";

export interface DayProcessData {
  events: IEvent[];
  selectedDate: Date;
  selectedRoomId: string;
  pixelHeight: number;
  visibleHours: TVisibleHours;
  multiDayEventsAtTop: boolean;
}

export interface DayResponseData {
  totalEvents: number;
  dayViews: DayView[];
  hours: number[];
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

export function CalendarDayView({ date }: { date: Date }) {
  const [isLoading, setLoading] = useState(true);
  const [isRefreshed, setRefreshed] = useState(false);
  const [dayViews, setDayViews] = useState<DayView[]>([]);
  const [hours, setHours] = useState<number[]>([]);

  const { workingHours, visibleHours, selectedRoomId, setIsHeaderLoading, setTotalEvents } = useCalendar();

  const workerRef = useRef<Worker | null>(null);

  const startDate: Date = startOfDay(date);
  const endDate: Date = endOfDay(date);
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

    const newWorker = new Worker(new URL("./calendar-day-webworker.ts", import.meta.url));

    newWorker.onmessage = (event: MessageEvent<DayResponseData>) => {
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
      const data: DayProcessData = {
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
    return <CalendarDayViewSkeleton date={date} />;
  }

  return (
    <>
      <div className="flex">
        <div className="flex flex-1 flex-col">
          <DayViewDayHeader key={dayViews[0].day} dayView={dayViews[0]} />

          <ScrollArea className="max-h-[50vh] md:max-h-[60vh] lg:max-h-[70vh] xl:max-h-[73vh]" type="always">
            <div className="flex border-l">
              {/* Hours column   h-[500px]  */}
              <HourColumn hours={hours} />

              {/* Day grid */}
              <div className="relative flex-1 border-b">
                <div className="relative">
                  <DayHourlyEventDialogs hours={hours} day={dayViews[0].dayDate} workingHours={workingHours} />

                  {dayViews[0].eventBlocks.map((block, blockIndex) => {
                    return (
                      <div
                        key={`day-${dayViews[0].day}-block-${blockIndex}-event-${block.event.eventId}`}
                        className="absolute p-1"
                        style={block.eventStyle}
                      >
                        <EventBlock eventBlock={block} heightInPixels={block.eventHeight} fetchData={async () => {}} />
                      </div>
                    );
                  })}
                </div>

                <CalendarTimeline />
              </div>
            </div>
          </ScrollArea>
        </div>

        <div className="hidden w-74 divide-y border-l md:block">
          <SingleCalendar
            className="mx-auto w-fit"
            mode="single"
            selected={date}
            onSelect={() => {}}
            month={date}
            onMonthChange={() => {}}
            required
            onToday={() => {}}
            startMonth={addYears(date, -25)}
            endMonth={addYears(date, 25)}
          />

          <div className="flex-1 space-y-3">
            {dayViews[0].eventBlocks.length > 0 ? (
              <div className="flex items-start gap-2 px-4 pt-4">
                <span className="relative mt-[5px] flex size-2.5">
                  <span className="absolute inline-flex size-full animate-ping rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex size-2.5 rounded-full bg-green-600"></span>
                </span>

                <p className="text-sm font-semibold text-foreground">Happening now</p>
              </div>
            ) : (
              <p className="p-4 text-center text-sm italic text-muted-foreground">
                No appointments or consultations at the moment
              </p>
            )}

            {dayViews[0].eventBlocks.length > 0 && (
              <div className="flex">
                <div className="flex flex-1 flex-col">
                  <ScrollArea className="max-h-[25vh] md:max-h-[35vh] lg:max-h-[40vh] px-4" type="always">
                    {/* h-[422px] max-h-[25vh] md:max-h-[35vh] lg:max-h-[45vh] */}
                    <div className="space-y-6 pb-4">
                      {dayViews[0].eventBlocks.map((block, blockIndex) => {
                        const room = false; // = currentEvents.room; //rooms.find((room) => room.id === event.room.id);

                        return (
                          <div key={block.event.eventId + "-" + blockIndex} className="space-y-1.5">
                            <p className="line-clamp-2 text-sm font-semibold">{block.event.title}</p>

                            {room && (
                              <div className="flex items-center gap-1.5 text-muted-foreground">
                                <User className="size-3.5" />
                                <span className="text-sm">{room}</span>
                              </div>
                            )}

                            <div className="flex items-center gap-1.5 text-muted-foreground">
                              <Calendar className="size-3.5" />
                              <span className="text-sm">{format(new Date(), "MMM d, yyyy")}</span>
                            </div>

                            <div className="flex items-center gap-1.5 text-muted-foreground">
                              <Clock className="size-3.5" />
                              <span className="text-sm">
                                {format(block.event.startDate, "h:mm a")} - {format(block.event.endDate, "h:mm a")}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </ScrollArea>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
