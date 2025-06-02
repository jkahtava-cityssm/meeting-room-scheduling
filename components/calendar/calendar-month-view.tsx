"use client";

import { useEffect, useRef, useState } from "react";

import { useCalendar } from "@/contexts/CalendarProvider";

import { MonthViewDayCellSkeleton } from "./skeleton-calendar-month-day-cell";
import { IEvent } from "@/lib/schemas/schemas";
import useSWR from "swr";

import { ScrollArea, ScrollBar } from "../ui/scroll-area";
import { MonthViewDayEvents } from "./calendar-month-view-day-events";
import { MonthViewDayHeader } from "./calendar-month-view-day-header";
import { cn } from "@/lib/utils";
import { MonthViewDayFooter } from "./calendar-month-view-day-footer";
import { getDaysInView } from "@/lib/helpers";

export interface MonthProcessData {
  events: IEvent[];
  selectedDate: Date;
  selectedRoomId: string;
  multiDayEventsAtTop: boolean;
}

export interface MonthResponseData {
  totalEvents: number;
  dayViews: DayView[];
  weekViews: WeekView[];
}

export interface WeekView {
  week: number;
  maxDailyEvents: number;
  dayViews: DayView[];
}

export interface DayView {
  day: number;
  dayDate: Date;
  isToday: boolean;
  isSunday: boolean;
  isCurrentMonth: boolean;
  eventRecords: EventView[];
}

export interface EventView {
  index: number;
  position: "none" | "middle" | "first" | "last";
  event: IEvent | undefined;
}

const WEEK_DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function CalendarMonthView({ date }: { date: Date }) {
  //const startDate: Date = startOfMonth(date);
  //const endDate: Date = endOfMonth(date);

  const { startDate, endDate } = getDaysInView(date);
  const { selectedRoomId, setTotalEvents, setIsHeaderLoading } = useCalendar();

  const workerRef = useRef<Worker | null>(null);

  const [weekViews, setWeekViews] = useState<WeekView[]>([]);

  const [isLoading, setLoading] = useState(true);
  const [isRefreshed, setRefreshed] = useState(false);

  const { data: events, isLoading: isPending } = useSWR<IEvent[]>(
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

    const newWorker = new Worker(new URL("./calendar-month-webworker.ts", import.meta.url));

    newWorker.onmessage = (event: MessageEvent<MonthResponseData>) => {
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
      const data: MonthProcessData = {
        events: events,
        selectedDate: date,
        selectedRoomId: selectedRoomId,
        multiDayEventsAtTop: true,
      };
      setLoading(true);
      setIsHeaderLoading(true);

      workerRef.current.postMessage(data);
    }
  }, [events, date, selectedRoomId, isRefreshed, setIsHeaderLoading]);

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
        className="grid grid-cols-7 border-b-1"
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
                <ScrollArea
                  type="scroll"
                  className="h-18.5 sm:h-18.5 lg:h-23.5"
                  //className={`max-h-18.5 sm:max-h-18.5 lg:max-h-23.5 overflow-y-auto ${week.maxDailyEvents <= (isSmall ? 2 : 3) && "pr-[15px]"}`}
                >
                  <div className="grid grid-cols-7 min-h-18.5 sm:min-h-18 lg:min-h-23.5 overflow-hidden ">
                    {week.dayViews.map((day) => {
                      return <MonthViewDayEvents key={day.dayDate.toISOString()} dayRecord={day} />;
                    })}
                  </div>
                  <ScrollBar orientation="vertical" forceMount></ScrollBar>
                </ScrollArea>
              </div>
              <div
                className="grid grid-cols-7 overflow-hidden border-b-1"
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
      {/*<div className="grid grid-cols-7 overflow-hidden">
        {dayViews.map((day) => (
          <MonthViewDayCell key={day.dayDate.toISOString()} dayRecord={day} />
        ))}
      </div>*/}
    </>
  );
}
