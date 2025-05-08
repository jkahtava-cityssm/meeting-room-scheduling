"use client";

import { useEffect, useMemo, useState } from "react";

import { useCalendar } from "@/calendar/contexts/calendar-context";

import { MonthViewDayCell } from "@/calendar/components/calendar-month-view-day-cell";

import { getCalendarCells, MAX_VISIBLE_EVENTS } from "@/calendar/helpers";

import type { IEvent } from "@/calendar/interfaces";

import {
  differenceInDays,
  eachDayOfInterval,
  endOfMonth,
  isSameDay,
  parseISO,
  parseJSON,
  startOfDay,
  startOfMonth,
} from "date-fns";
import { CalendarHeaderSkeleton } from "./skeleton-calendar-header";
import { CalendarHeader } from "./calendar-all-header";
import { MonthViewDayCellSkeleton } from "./skeleton-calendar-month-day-cell";

import { getEventsMonthly } from "@/services/events";

const WEEK_DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function CalendarMonthView() {
  const { selectedDate, selectedRoomId } = useCalendar();

  const [events, setEvents] = useState<IEvent[]>([]);

  const [isLoading, setLoading] = useState(true);

  const fetchMonthlyEvents = async () => {
    setLoading(true);

    const eventList = await getEventsMonthly(selectedDate);

    const StartOfMonth = startOfMonth(selectedDate);
    const EndOfMonth = endOfMonth(selectedDate);

    setEvents(eventList.data);
    setLoading(false);
  };

  useEffect(() => {
    fetchMonthlyEvents();
  }, [selectedDate]);

  const filteredEvents = useMemo(
    () =>
      events.filter((event) => {
        return event.roomId.toString() === selectedRoomId || selectedRoomId === "-1";
      }),
    [events, selectedRoomId]
  );

  const cells = useMemo(() => getCalendarCells(selectedDate), [selectedDate]);

  const eventPositions = useMemo(
    () => calculateEventPositions(filteredEvents, selectedDate),
    [filteredEvents, selectedDate]
  );

  return (
    <div>
      <CalendarHeader view={"month"} selectedDate={selectedDate} events={filteredEvents} isLoading={isLoading} />
      {
        //isLoading ? <CalendarHeaderSkeleton view={"month"} /> : <CalendarHeader view={"month"} />
      }
      <div className="grid grid-cols-7 divide-x">
        {WEEK_DAYS.map((day) => (
          <div key={day} className="flex items-center justify-center py-2">
            <span className="text-xs font-medium text-muted-foreground">{day}</span>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 overflow-hidden">
        {cells.map((cell) =>
          isLoading ? (
            <MonthViewDayCellSkeleton cell={cell} key={cell.date.toISOString()}></MonthViewDayCellSkeleton>
          ) : (
            <MonthViewDayCell
              key={cell.date.toISOString()}
              cell={cell}
              events={filteredEvents}
              eventPositions={eventPositions}
              fetchData={fetchMonthlyEvents}
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
