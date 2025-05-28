"use client";

import { useEffect, useState } from "react";
import { endOfYear, startOfYear } from "date-fns";

import { useCalendar } from "@/contexts/CalendarProvider";
import YearViewMonth from "./calendar-year-view-month";
import { IEvent } from "@/lib/schemas/schemas";
import useSWR from "swr";
import { YearViewSkeleton } from "./skeleton-calendar-year-view";
import { TVisibleHours } from "@/lib/types";

export interface MonthView {
  month: number;
  monthDate: Date;
  monthName: string;
  days: DayView[];
}

export interface DayView {
  day: number;
  dayDate: Date;
  isBlank: boolean;
  isToday: boolean;
  dayEvents: IEvent[];
}

export interface YearProcessData {
  eventList: IEvent[];
  recurringEventList: IEvent[];
  selectedDate: Date;
  selectedRoomId: string;
  visibleHours: TVisibleHours;
}

export interface YearResponseData {
  totalEvents: number;
  monthsViews: MonthView[];
}

export function CalendarYearView({ date }: { date: Date }) {
  const { selectedRoomId, visibleHours, setIsHeaderLoading, setTotalEvents } = useCalendar();

  const [workerInstance, setWorkerInstance] = useState<Worker>();
  const [monthViews, setMonthViews] = useState<MonthView[]>([]);

  const [isLoading, setLoading] = useState(true);
  const [isRefreshed, setRefreshed] = useState(false);

  const startDate: Date = startOfYear(date);
  const endDate: Date = endOfYear(date);

  const { data: events } = useSWR<IEvent[]>(
    `/api/events?startdate=${startDate.toISOString()}&enddate=${endDate.toISOString()}`
  );

  const { data: recurringEvents } = useSWR<IEvent[]>(
    `/api/recurrences?startdate=${startDate.toISOString()}&enddate=${endDate.toISOString()}`
  );

  useEffect(() => {
    //The Workerthread needs to be recreated when we navigate back to the page if the params havent changed.
    //nextjs cache's the route so this is my temporary fix
    setRefreshed(true);
  }, []);

  useEffect(() => {
    //This is mostly as an example for myself, technically this processing should likely be done on the server side.
    //But this example will come in handy for other applications
    const newWorker = new Worker(new URL("./calendar-year-webworker.ts", import.meta.url));

    newWorker.onmessage = (event: MessageEvent<YearResponseData>) => {
      setMonthViews(event.data.monthsViews);
      setTotalEvents(event.data.totalEvents);
      setIsHeaderLoading(false);
      setLoading(false);
    };

    setWorkerInstance(newWorker);

    return () => {
      if (workerInstance) {
        workerInstance.terminate();
      }
    };
  }, [date]);

  useEffect(() => {
    if (!events || !recurringEvents) {
      return;
    }

    if (workerInstance) {
      const data: YearProcessData = {
        eventList: events,
        recurringEventList: recurringEvents,
        selectedDate: date,
        selectedRoomId: selectedRoomId,

        visibleHours: visibleHours,
      };
      setLoading(true);
      setIsHeaderLoading(true);

      workerInstance.postMessage(data);
    }
  }, [events, recurringEvents, date, selectedRoomId, visibleHours, isRefreshed]);

  if (isLoading) {
    return <YearViewSkeleton date={date}></YearViewSkeleton>;
  }

  return (
    <>
      <div className="p-4">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {monthViews.map((month) => {
            return <YearViewMonth key={month.month.toString()} month={month} />;
          })}
        </div>
      </div>
    </>
  );
}
