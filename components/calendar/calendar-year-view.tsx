"use client";

import { useEffect, useRef, useState } from "react";
import { endOfYear, formatISO, startOfYear } from "date-fns";

import { useCalendar } from "@/contexts/CalendarProvider";
import YearViewMonth from "./calendar-year-view-month";
import { IEvent } from "@/lib/schemas/calendar";
import useSWR from "swr";
import { YearViewSkeleton } from "./skeleton-calendar-year-view";
import { TVisibleHours } from "@/lib/types";

export interface IMonthView {
  month: number;
  monthDate: Date;
  monthName: string;
  days: IDayView[];
}

export interface IDayView {
  day: number;
  dayDate: Date;
  isBlank: boolean;
  isToday: boolean;
  dayEvents: IEvent[];
}

export interface IYearProcessData {
  eventList: IEvent[];
  selectedDate: Date;
  selectedRoomId: string;
  visibleHours: TVisibleHours;
}

export interface IYearResponseData {
  totalEvents: number;
  monthsViews: IMonthView[];
}

export function CalendarYearView({ date }: { date: Date }) {
  const { selectedRoomId, visibleHours, setIsHeaderLoading, setTotalEvents } = useCalendar();

  const workerRef = useRef<Worker | null>(null);
  const [monthViews, setMonthViews] = useState<IMonthView[]>([]);

  const [isLoading, setLoading] = useState(true);
  const [isRefreshed, setRefreshed] = useState(false);

  const startDate: Date = startOfYear(date);
  const endDate: Date = endOfYear(date);

  //console.log(formatISO(startDate, { representation: "date" }));
  const { data: events } = useSWR<IEvent[]>(
    `/api/events?startdate=${formatISO(startDate, { representation: "date" })}&enddate=${formatISO(endDate, {
      representation: "date",
    })}`
  );

  /*const { data: recurringEvents } = useSWR<IEvent[]>(
    `/api/recurrences?startdate=${startDate.toISOString()}&enddate=${endDate.toISOString()}`
  );*/

  useEffect(() => {
    //The Workerthread needs to be recreated when we navigate back to the page if the params havent changed.
    //nextjs cache's the route so this is my temporary fix
    setRefreshed(true);
  }, []);

  useEffect(() => {
    //This is mostly as an example for myself, technically this processing should likely be done on the server side.
    //But this example will come in handy for other applications
    const newWorker = new Worker(new URL("./calendar-year-webworker.ts", import.meta.url));

    newWorker.onmessage = (event: MessageEvent<IYearResponseData>) => {
      setMonthViews(event.data.monthsViews);
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
      const data: IYearProcessData = {
        eventList: events,
        selectedDate: date,
        selectedRoomId: selectedRoomId,

        visibleHours: visibleHours,
      };
      setLoading(true);
      setIsHeaderLoading(true);

      workerRef.current.postMessage(data);
    }
  }, [events, date, selectedRoomId, visibleHours, isRefreshed, setIsHeaderLoading]);

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
