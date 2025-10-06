"use client";

import { startOfDay, endOfDay, format } from "date-fns";
import { useCalendar } from "@/contexts/CalendarProvider";
import { ScrollArea } from "@/components/ui/scroll-area";

import { CalendarTimeline } from "@/components/calendar/calendar-day-timeline";

import { DayHourlyEventDialogs } from "./calendar-day-event-block-add-hour-block";
import { HourColumn } from "./calendar-day-column-hourly";
import { DayViewDayHeader } from "./calendar-day-view-day-header";
import { EventBlock } from "./calendar-day-event-block";
import { useEffect, useRef, useState } from "react";

import { CalendarDayViewSkeleton } from "./skeleton-calendar-day-view";
import { IEvent } from "@/lib/schemas/calendar";
import { TVisibleHours } from "@/lib/types";

import { CalendarDayColumnCalendar } from "./calendar-day-column-calendar";
import { useEventsQuery } from "@/services/events";

export interface IDayProcessData {
  events: IEvent[];
  selectedDate: Date;
  selectedRoomId: string;
  pixelHeight: number;
  visibleHours: TVisibleHours;
  multiDayEventsAtTop: boolean;
}

export interface IDayResponseData {
  totalEvents: number;
  dayViews: IDayView[];
  hours: number[];
  filteredEvents: IEvent[];
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

export function CalendarDayView({ date, userId }: { date: Date; userId?: string }) {
  const [isLoading, setLoading] = useState(true);
  const [isRefreshed, setRefreshed] = useState(false);
  const [dayViews, setDayViews] = useState<IDayView[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<IEvent[]>([]);
  const [hours, setHours] = useState<number[]>([]);

  const { workingHours, visibleHours, selectedRoomId, setIsHeaderLoading, setTotalEvents } = useCalendar();

  const workerRef = useRef<Worker | null>(null);

  const startDate: Date = startOfDay(date);
  const endDate: Date = endOfDay(date);

  const { isPending, error, data: events, isFetching } = useEventsQuery(startDate, endDate, userId);

  useEffect(() => {
    //The Workerthread needs to be recreated when we navigate back to the page if the params havent changed.
    //nextjs cache's the route so this is my temporary fix
    setRefreshed(true);
  }, []);

  useEffect(() => {
    setLoading(true);
  }, [date]);

  useEffect(() => {
    //This is mostly as an example for myself, technically this processing should likely be done on the server side.
    //But this example will come in handy for other applications

    if (workerRef.current) {
      return;
    }

    const newWorker = new Worker(new URL("./webworkers/calendar-day-webworker.ts", import.meta.url));

    newWorker.onmessage = (event: MessageEvent<IDayResponseData>) => {
      setDayViews(event.data.dayViews);
      setHours(event.data.hours);
      setTotalEvents(event.data.totalEvents);
      setFilteredEvents(event.data.filteredEvents);
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
      const data: IDayProcessData = {
        events: events,
        visibleHours: visibleHours,
        selectedDate: date,
        selectedRoomId: selectedRoomId,
        multiDayEventsAtTop: true,
        pixelHeight: 96,
      };
      //setLoading(true);
      setIsHeaderLoading(true);

      workerRef.current.postMessage(data);
    }
  }, [events, date, selectedRoomId, isRefreshed, setIsHeaderLoading, visibleHours]);

  return (
    <>
      <div className="flex">
        {isLoading ? (
          <CalendarDayViewSkeleton date={date} />
        ) : (
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

                    {dayViews[0].eventBlocks.map((block) => {
                      return (
                        <div
                          key={`day-${dayViews[0].day}-block-${format(
                            block.event.startDate,
                            "yyyy-MM-dd-HH-mm"
                          )}-event-${block.event.eventId}`}
                          className="absolute p-1"
                          style={block.eventStyle}
                        >
                          <EventBlock eventBlock={block} heightInPixels={block.eventHeight} />
                        </div>
                      );
                    })}
                  </div>

                  <CalendarTimeline />
                </div>
              </div>
            </ScrollArea>
          </div>
        )}
        <CalendarDayColumnCalendar
          date={date}
          isLoading={isLoading}
          events={filteredEvents}
          view={"day"}
        ></CalendarDayColumnCalendar>
      </div>
    </>
  );
}
