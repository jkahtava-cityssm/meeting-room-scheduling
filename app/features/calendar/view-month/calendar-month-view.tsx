"use client";

import { useEffect, useRef, useState } from "react";

import { useCalendar } from "@/contexts/CalendarProvider";

import { MonthViewDayCellSkeleton } from "./skeleton-calendar-month-day-cell";
import { IEvent } from "@/lib/schemas/calendar";

import { MonthViewDayEvents } from "./calendar-month-view-day-events";
import { MonthViewDayHeader } from "./calendar-month-view-day-header";
import { cn } from "@/lib/utils";
import { MonthViewDayFooter } from "./calendar-month-view-day-footer";
import { getDaysInView } from "@/lib/helpers";
import { useEventsQuery } from "@/lib/services/events";
import { TVisibleHours } from "@/lib/types";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";

export interface IMonthProcessData {
  events: IEvent[];
  selectedDate: Date;
  selectedRoomId: string;
  multiDayEventsAtTop: boolean;
  visibleHours: TVisibleHours;
}

export interface IMonthResponseData {
  totalEvents: number;
  dayViews: IDayView[];
  weekViews: IWeekView[];
}

export interface IWeekView {
  week: number;
  maxDailyEvents: number;
  dayViews: IDayView[];
}

export interface IDayView {
  day: number;
  dayDate: Date;
  isToday: boolean;
  isSunday: boolean;
  isCurrentMonth: boolean;
  eventRecords: IEventView[];
}

export interface IEventView {
  index: number;
  position: "none" | "middle" | "first" | "last";
  event: IEvent | undefined;
}

const WEEK_DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function CalendarMonthView({ date, userId }: { date: Date; userId?: string }) {
  //const startDate: Date = startOfMonth(date);
  //const endDate: Date = endOfMonth(date);

  const { startDate, endDate } = getDaysInView(date);
  const { visibleHours, selectedRoomId, setTotalEvents, setIsHeaderLoading } = useCalendar();

  const workerRef = useRef<Worker | null>(null);

  const [weekViews, setWeekViews] = useState<IWeekView[]>([]);

  const [isLoading, setLoading] = useState(true);
  const [isRefreshed, setRefreshed] = useState(false);

  /*const { data: events, isLoading: isPending } = useSWR<IEvent[]>(
    `/api/events?startdate=${startDate.toISOString()}&enddate=${endDate.toISOString()}`
  );*/

  const { isPending, data: events } = useEventsQuery(startDate, endDate, userId);

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

    const newWorker = new Worker(new URL("../webworkers/calendar-month-webworker.ts", import.meta.url));

    newWorker.onmessage = (event: MessageEvent<IMonthResponseData>) => {
      setWeekViews(event.data.weekViews);
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
      const data: IMonthProcessData = {
        events: events,
        selectedDate: date,
        selectedRoomId: selectedRoomId,
        multiDayEventsAtTop: true,
        visibleHours: visibleHours,
      };
      //setLoading(true);
      setIsHeaderLoading(true);

      workerRef.current.postMessage(data);
    }
  }, [events, date, selectedRoomId, isRefreshed, setIsHeaderLoading, visibleHours]);

  if (isLoading || isPending) {
    return <MonthViewDayCellSkeleton date={date} />;
  }
  //134
  //24
  //94
  //26

  return (
    <>
      <div
        className="grid grid-cols-7 border-b"
        //pr-[15px]
      >
        {WEEK_DAYS.map((day) => (
          <div
            key={day}
            className={cn("flex items-center justify-center py-2 border-l", day === "Sun" && "border-l-0")}
          >
            <span className="text-xs font-medium text-muted-foreground">{day}</span>
          </div>
        ))}
      </div>
      <div>
        {weekViews.map((week) => {
          return (
            <div key={`week-${week.week}`}>
              <div
                className="grid grid-cols-7 overflow-hidden "
                //pr-[15px]
              >
                {week.dayViews.map((day, index) => {
                  return <MonthViewDayHeader key={`header-${index}`} dayRecord={day} />;
                })}
              </div>
              <div className="h-18 sm:h-18 lg:h-23 overflow-hidden">
                <ScrollArea type="scroll" className="h-18.5 sm:h-18.5 lg:h-23.5">
                  <div className="grid grid-cols-7 min-h-18.5 sm:min-h-18 lg:min-h-23.5 overflow-hidden ">
                    {week.dayViews.map((day) => {
                      return <MonthViewDayEvents key={day.dayDate.toISOString()} dayRecord={day} userId={userId} />;
                    })}
                  </div>
                  <ScrollBar orientation="vertical" forceMount></ScrollBar>
                </ScrollArea>
              </div>
              <div
                className="grid grid-cols-7 overflow-hidden border-b"
                //pr-[15px]
              >
                {week.dayViews.map((day, index) => {
                  return <MonthViewDayFooter key={`footer-${index}`} dayRecord={day} />;
                })}
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
