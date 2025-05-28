"use client";

import { useEffect, useMemo, useState, lazy, Suspense, useTransition } from "react";
import {
  addMonths,
  endOfYear,
  format,
  getDaysInMonth,
  isSameDay,
  isToday,
  parse,
  startOfMonth,
  startOfYear,
} from "date-fns";

import { useCalendar } from "@/contexts/CalendarProvider";

import { CalendarHeader } from "./calendar-all-header";
import YearViewMonth from "./calendar-year-view-month";
import {
  generateMultiDayEventsInPeriod,
  generateRecurringEventsInPeriod,
  useAllYearlyEvents,
  useEvents,
} from "@/services/events";
import { filterEventsByRoom, navigateDate, navigateURL } from "../../lib/helpers";
import { IEvent } from "@/lib/schemas/schemas";
import { forEach } from "lodash";
import useSWR from "swr";
import { useSearchParams, useRouter } from "next/navigation";
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

function getSelectedDate(selectedDate: string | null) {
  return selectedDate !== null ? startOfYear(parse(selectedDate, "yyyy", new Date())) : startOfYear(new Date());
}

export function CalendarYearView({ date, isLoading }: { date: Date; isLoading: boolean }) {
  const { selectedRoomId, visibleHours, setIsLoading, setTotalEvents } = useCalendar();

  const [workerInstance, setWorkerInstance] = useState<Worker>();

  const [monthViews, setMonthViews] = useState<MonthView[]>([]);

  const startDate: Date = startOfYear(date);
  const endDate: Date = endOfYear(date);

  const { data: events } = useSWR<IEvent[]>(
    `/api/events?startdate=${startDate.toISOString()}&enddate=${endDate.toISOString()}`
  );

  const { data: recurringEvents } = useSWR<IEvent[]>(
    `/api/recurrences?startdate=${startDate.toISOString()}&enddate=${endDate.toISOString()}`
  );

  //const yearProcessor = useMemo(() => new Worker(new URL("./calendar-year-webworker.ts", import.meta.url)), []);

  useEffect(() => {
    const newWorker = new Worker(new URL("./calendar-year-webworker.ts", import.meta.url));

    newWorker.onmessage = (event: MessageEvent<YearResponseData>) => {
      setMonthViews(event.data.monthsViews);
      setTotalEvents(event.data.totalEvents);
      setIsLoading(false);
    };

    setWorkerInstance(newWorker);

    return () => {
      if (workerInstance) {
        workerInstance.terminate();
      }
    };
  }, []);

  useEffect(() => {
    if (!events || !recurringEvents) {
      return;
    }

    /*if (window.Worker) {
      const data: YearProcessData = {
        eventList: events,
        recurringEventList: recurringEvents,
        selectedDate: date,
        selectedRoomId: selectedRoomId,

        visibleHours: visibleHours,
      };
      yearProcessor.postMessage(data);
    }*/

    if (workerInstance) {
      const data: YearProcessData = {
        eventList: events,
        recurringEventList: recurringEvents,
        selectedDate: date,
        selectedRoomId: selectedRoomId,

        visibleHours: visibleHours,
      };
      workerInstance.postMessage(data);
    }
  }, [events, recurringEvents, date, selectedRoomId, visibleHours]);

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
