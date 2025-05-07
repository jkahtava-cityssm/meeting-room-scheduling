"use client";

import { Suspense, useEffect, useMemo, useState, lazy } from "react";
import { addMonths, endOfYear, startOfYear } from "date-fns";

import { useCalendar } from "@/calendar/contexts/calendar-context";

//import YearViewMonth from "@/calendar/components/year-view/year-view-month";

//const YearViewMonth = lazy(() => import("@/calendar/components/year-view/year-view-month"));

import type { IEvent } from "@/calendar/interfaces";
import { YearViewMonthSkeleton } from "./year-view-month-skeleton";
import { CalendarHeader } from "../header/calendar-header";
import { CalendarHeaderSkeleton } from "../header/calendar-header-skeleton";
import YearViewMonth from "./year-view-month";
import { getEventsYearly } from "@/services/events";

interface IProps {
  allEvents: IEvent[];
}

export function CalendarYearView() {
  const { selectedDate } = useCalendar();

  const [events, setEvents] = useState<IEvent[]>([]);

  const [isLoading, setLoading] = useState(true);

  const fetchEvents = async () => {
    setLoading(true);

    const eventList = await getEventsYearly(selectedDate);

    setEvents(eventList.data);
    setLoading(false);
  };

  useEffect(() => {
    fetchEvents();
  }, [selectedDate]);

  const months = useMemo(() => {
    const yearStart = startOfYear(selectedDate);
    return Array.from({ length: 12 }, (_, i) => addMonths(yearStart, i));
  }, [selectedDate]);

  return (
    <>
      <CalendarHeader view={"year"} />
      {
        //isLoading ? <CalendarHeaderSkeleton view={"year"} /> : <CalendarHeader view={"year"} events={events} />
      }
      <div className="p-4">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {months.map((month) =>
            isLoading ? (
              <YearViewMonthSkeleton key={month.toString()}></YearViewMonthSkeleton>
            ) : (
              <YearViewMonth key={month.toString()} month={month} events={events} />
            )
          )}
        </div>
      </div>
    </>
  );
}
