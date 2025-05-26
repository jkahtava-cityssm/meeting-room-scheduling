"use client";

import { useEffect, useMemo, useState } from "react";

import { useCalendar } from "@/contexts/CalendarProvider";

import { MonthViewDayCell } from "@/components/calendar/calendar-month-view-day-cell";

import { filterEventsByRoom, getCalendarCells, MAX_VISIBLE_EVENTS } from "@/lib/helpers";

import {
  differenceInDays,
  eachDayOfInterval,
  endOfMonth,
  isSameDay,
  parse,
  parseISO,
  parseJSON,
  startOfDay,
  startOfMonth,
} from "date-fns";

import { CalendarHeader } from "./calendar-all-header";
import { MonthViewDayCellSkeleton } from "./skeleton-calendar-month-day-cell";

import { useAllMonthlyEvents } from "@/services/events";
import { IEvent } from "@/lib/schemas/schemas";
import { useSearchParams } from "next/navigation";

const WEEK_DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function getSelectedDate(selectedDate: string | null) {
  return selectedDate !== null ? parse(selectedDate, "yyyy-MM", new Date()) : new Date();
}

export function CalendarMonthView() {
  const searchParams = useSearchParams();

  const value = searchParams.get("selectedDate");
  const selectedDate = getSelectedDate(value);
  const { selectedRoomId, visibleHours } = useCalendar();

  const { events, isLoading, isError } = useAllMonthlyEvents(selectedDate, visibleHours);

  const [isRendered, setRendered] = useState(false);

  useEffect(() => {
    setTimeout(() => {
      setRendered(true);
    }, 1);
  }, []);

  const filteredEvents = useMemo(() => {
    if (events) {
      return filterEventsByRoom(events, selectedRoomId);
    }
    return [];
  }, [events, selectedRoomId]);

  const cells = useMemo(() => getCalendarCells(selectedDate), [selectedDate]);

  const eventPositions = useMemo(
    () => calculateEventPositions(filteredEvents, selectedDate),
    [filteredEvents, selectedDate]
  );

  return (
    <div>
      <CalendarHeader
        view={"month"}
        selectedDate={selectedDate}
        events={filteredEvents}
        isLoading={isLoading || !isRendered}
      />
      <div className="grid grid-cols-7 divide-x">
        {WEEK_DAYS.map((day) => (
          <div key={day} className="flex items-center justify-center py-2">
            <span className="text-xs font-medium text-muted-foreground">{day}</span>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 overflow-hidden">
        {cells.map((cell) =>
          isLoading || !isRendered ? (
            <MonthViewDayCellSkeleton cell={cell} key={cell.date.toISOString()}></MonthViewDayCellSkeleton>
          ) : (
            <MonthViewDayCell
              key={cell.date.toISOString()}
              cell={cell}
              events={filteredEvents}
              eventPositions={eventPositions}
              fetchData={async () => {}}
            />
          )
        )}
      </div>
    </div>
  );
}

export function calculateEventPositions(events: IEvent[], selectedDate: Date) {
  const monthStart = startOfMonth(selectedDate);
  const monthEnd = endOfMonth(selectedDate);

  const multiDayEvents = events.filter((event: IEvent) => {
    return !isSameDay(event.startDate, event.endDate);
  });

  const singleDayEvents = events.filter((event: IEvent) => {
    return isSameDay(event.startDate, event.endDate);
  });

  const eventPositions: { [key: string]: number } = {};
  const occupiedPositions: { [key: string]: boolean[] } = {};

  eachDayOfInterval({ start: monthStart, end: monthEnd }).forEach((day) => {
    occupiedPositions[day.toISOString()] = [false, false, false];
  });

  const sortedEvents = [
    ...multiDayEvents.sort((firstEvent, secondEvent) => {
      const aDuration = differenceInDays(firstEvent.endDate, firstEvent.startDate);
      const bDuration = differenceInDays(secondEvent.endDate, secondEvent.startDate);
      try {
        const firstEventTime = parseISO(firstEvent.startDate.toUTCString()).getTime();
        const secondEventTime = parseISO(secondEvent.startDate.toUTCString()).getTime();
      } catch {
        console.log(firstEvent.startDate, secondEvent.startDate);
        console.log(parseJSON(firstEvent.startDate.toString()));
      }

      const firstEventTime = parseJSON(firstEvent.startDate.toString()).getTime();
      const secondEventTime = parseJSON(secondEvent.startDate.toString()).getTime();
      return bDuration - aDuration || firstEventTime - secondEventTime;
    }),
    ...singleDayEvents.sort((a, b) => a.startDate.getTime() - b.startDate.getTime()),
  ];

  sortedEvents.forEach((event) => {
    const eventStart = event.startDate;
    const eventEnd = event.endDate;

    const eventDays = eachDayOfInterval({
      start: eventStart < monthStart ? monthStart : eventStart,
      end: eventEnd > monthEnd ? monthEnd : eventEnd,
    });

    let position = -1;

    for (let i = 0; i < MAX_VISIBLE_EVENTS; i++) {
      if (
        eventDays.every((day) => {
          const dayPositions = occupiedPositions[startOfDay(day).toISOString()];
          return dayPositions && !dayPositions[i];
        })
      ) {
        position = i;
        break;
      }
    }

    if (position !== -1) {
      eventDays.forEach((day) => {
        const dayKey = startOfDay(day).toISOString();
        occupiedPositions[dayKey][position] = true;
      });
      eventPositions[event.eventId] = position;
    }
  });

  return eventPositions;
}
