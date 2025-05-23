"use client";

import { useEffect, useMemo, useState, lazy } from "react";
import { addMonths, startOfYear } from "date-fns";

import { useCalendar } from "@/components/calendar/contexts/calendar-context";
import type { IEvent } from "@/components/calendar/lib/interfaces";
import { YearViewMonthSkeleton } from "./skeleton-calendar-year-view-month-cell";
import { CalendarHeader } from "./calendar-all-header";
import YearViewMonth from "./calendar-year-view-month";
import { getEventsYearly, useAllYearlyEvents } from "@/services/events";
import { filterEventsByRoom } from "./lib/helpers";

export function CalendarYearView() {
  const { selectedDate, selectedRoomId, visibleHours } = useCalendar();
  /*const [events, setEvents] = useState<IEvent[]>([]);
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
8=*/

  const { events, isLoading, isError } = useAllYearlyEvents(selectedDate, visibleHours);

  const months = useMemo(() => {
    const yearStart = startOfYear(selectedDate);
    return Array.from({ length: 12 }, (_, i) => addMonths(yearStart, i));
  }, [selectedDate]);

  const filteredEvents = useMemo(() => {
    if (events) {
      return filterEventsByRoom(events, selectedRoomId);
    }
    return [];
  }, [events, selectedRoomId]);

  return (
    <>
      <CalendarHeader view={"year"} selectedDate={selectedDate} events={filteredEvents} isLoading={isLoading} />
      <div className="p-4">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {months.map((month) =>
            isLoading ? (
              <YearViewMonthSkeleton key={month.toString()}></YearViewMonthSkeleton>
            ) : (
              <YearViewMonth key={month.toString()} month={month} events={filteredEvents} />
            )
          )}
        </div>
      </div>
    </>
  );
}
