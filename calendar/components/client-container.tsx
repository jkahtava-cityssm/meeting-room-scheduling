"use client";

import { Suspense, useMemo } from "react";
import { isSameDay, parseISO } from "date-fns";
import { uniqBy } from "lodash";

import { useCalendar } from "@/calendar/contexts/calendar-context";

import { CalendarHeader } from "@/calendar/components/header/calendar-header";
import { CalendarYearView } from "@/calendar/components/year-view/calendar-year-view";
import { CalendarMonthView } from "@/calendar/components/month-view/calendar-month-view";
import { CalendarAgendaView } from "@/calendar/components/agenda-view/calendar-agenda-view";
import { CalendarDayView } from "@/calendar/components/week-and-day-view/calendar-day-view";
import { CalendarWeekView } from "@/calendar/components/week-and-day-view/calendar-week-view";

import type { TCalendarView } from "@/calendar/types";
import { splitMultiDayEvents } from "../helpers";
import { IEvent } from "../interfaces";

export function ClientContainer({ view }: { view: TCalendarView }) {
  const { selectedDate, selectedRoomId, events, visibleHours } = useCalendar();

  const filteredEvents = useMemo(() => {
    return events.filter((event) => {
      const eventStartDate = parseISO(event.startDate);
      const eventEndDate = parseISO(event.endDate);

      if (view === "year") {
        const yearStart = new Date(selectedDate.getFullYear(), 0, 1);
        const yearEnd = new Date(selectedDate.getFullYear(), 11, 31, 23, 59, 59, 999);
        const isInSelectedYear = eventStartDate <= yearEnd && eventEndDate >= yearStart;
        const isUserMatch = selectedRoomId === "all" || event.room.id === selectedRoomId;
        return isInSelectedYear && isUserMatch;
      }

      if (view === "month" || view === "agenda") {
        const monthStart = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1);
        const monthEnd = new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 0, 23, 59, 59, 999);
        const isInSelectedMonth = eventStartDate <= monthEnd && eventEndDate >= monthStart;
        const isUserMatch = selectedRoomId === "all" || event.room.id === selectedRoomId;
        return isInSelectedMonth && isUserMatch;
      }

      if (view === "week") {
        const dayOfWeek = selectedDate.getDay();

        const weekStart = new Date(selectedDate);
        weekStart.setDate(selectedDate.getDate() - dayOfWeek);
        weekStart.setHours(0, 0, 0, 0);

        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6);
        weekEnd.setHours(23, 59, 59, 999);

        const isInSelectedWeek = eventStartDate <= weekEnd && eventEndDate >= weekStart;
        const isUserMatch = selectedRoomId === "all" || event.room.id === selectedRoomId;
        return isInSelectedWeek && isUserMatch;
      }

      if (view === "day") {
        const dayStart = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate(), 0, 0, 0);
        const dayEnd = new Date(
          selectedDate.getFullYear(),
          selectedDate.getMonth(),
          selectedDate.getDate(),
          23,
          59,
          59
        );
        const isInSelectedDay = eventStartDate <= dayEnd && eventEndDate >= dayStart;
        const isUserMatch = selectedRoomId === "all" || event.room.id === selectedRoomId;
        return isInSelectedDay && isUserMatch;
      }
    });
  }, [selectedDate, selectedRoomId, events, view]);

  const singleDayEvents = filteredEvents.filter((event) => {
    const startDate = parseISO(event.startDate);
    const endDate = parseISO(event.endDate);
    return isSameDay(startDate, endDate);
  });

  const multiDayEvents = filteredEvents.filter((event) => {
    const startDate = parseISO(event.startDate);
    const endDate = parseISO(event.endDate);
    return !isSameDay(startDate, endDate);
  });

  //const combinedDayEvents = [...singleDayEvents, ...splitMultiDayEvents(multiDayEvents, visibleHours)];
  // For year view, we only care about the start date
  // by using the same date for both start and end,
  // we ensure only the start day will show a dot
  const eventStartDates = useMemo(() => {
    return filteredEvents.map((event) => ({
      ...event,
      endDate: event.startDate,
    }));
  }, [filteredEvents]);

  return (
    <div className="overflow-hidden rounded-xl border">
      <Suspense fallback={<div> MAIN CONTENT</div>}>
        <CalendarHeader view={view} events={filteredEvents} />
        {view === "day" && <CalendarDayView events={filteredEvents} />}
        {view === "month" && <CalendarMonthView events={filteredEvents} />}
        {view === "week" && <CalendarWeekView events={filteredEvents} />}
        {view === "year" && <CalendarYearView allEvents={eventStartDates} />}
        {view === "agenda" && <CalendarAgendaView singleDayEvents={singleDayEvents} multiDayEvents={multiDayEvents} />}
      </Suspense>
    </div>
  );
}
