"use client";

import { useEffect, useMemo, useState, lazy, Suspense } from "react";
import { addMonths, startOfYear } from "date-fns";

import { useCalendar } from "@/contexts/CalendarProvider";

import { YearViewMonthSkeleton } from "./skeleton-calendar-year-view-month-cell";
import { CalendarHeader } from "./calendar-all-header";
import YearViewMonth from "./calendar-year-view-month";
import { useAllYearlyEvents } from "@/services/events";
import { filterEventsByRoom } from "../../lib/helpers";

export function CalendarYearView() {
  const { selectedDate, selectedRoomId, visibleHours } = useCalendar();

  const { events, isLoading, isError } = useAllYearlyEvents(selectedDate, visibleHours);

  const [isRendered, setRendered] = useState(true);

  useEffect(() => {
    setTimeout(() => {
      setRendered(true);
    }, 100);
  }, []);

  const months = useMemo(() => {
    const yearStart = startOfYear(selectedDate);
    return Array.from({ length: 12 }, (_, i) => addMonths(yearStart, i));
  }, [selectedDate]);

  const filteredEvents = useMemo(() => {
    if (events) {
      //console.log("?????");
      //setRendered(false);
      const filter = filterEventsByRoom(events, selectedRoomId);
      //setRendered(true);
      return filter;
    }
    return [];
  }, [events, selectedRoomId]);

  return (
    <>
      <CalendarHeader
        view={"year"}
        selectedDate={selectedDate}
        events={filteredEvents}
        isLoading={isLoading || !isRendered}
      />
      <div className="p-4">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {months.map((month) =>
            isLoading || !isRendered ? (
              <YearViewMonthSkeleton key={month.toString()}></YearViewMonthSkeleton>
            ) : (
              <Suspense key={month.toString()} fallback={<>TTT</>}>
                <YearViewMonth key={month.toString()} month={month} events={filteredEvents} />
              </Suspense>
            )
          )}
        </div>
      </div>
    </>
  );
}
