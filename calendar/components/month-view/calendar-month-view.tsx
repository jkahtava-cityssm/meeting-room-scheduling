"use client";

import { useEffect, useMemo, useState } from "react";

import { useCalendar } from "@/calendar/contexts/calendar-context";

import { MonthViewDayCell } from "@/calendar/components/month-view/month-view-day-cell";

import { getCalendarCells } from "@/calendar/helpers";

import type { IEvent } from "@/calendar/interfaces";

import { uniqBy } from "lodash";
import {
  differenceInDays,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  isSameDay,
  parseISO,
  parseJSON,
  startOfDay,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import { CalendarHeaderSkeleton } from "../header/calendar-header-skeleton";
import { CalendarHeader } from "../header/calendar-header";
import { MonthViewDayCellSkeleton } from "./month-view-day-cell-skeleton";
import { MAX_VISIBLE_EVENTS } from "@/calendar/mocks";
import { tr } from "date-fns/locale";
import { getEvents } from "@/services/events";
import { prisma } from "@/prisma";

const WEEK_DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function CalendarMonthView() {
  const { selectedDate } = useCalendar();

  const [events, setEvents] = useState<IEvent[]>([]);

  const [isLoading, setLoading] = useState(true);

  const fetchEvents = async () => {
    setLoading(true);

    const StartOfMonth = startOfMonth(selectedDate);
    const EndOfMonth = endOfMonth(selectedDate);

    const eventList = await getEvents(StartOfMonth, EndOfMonth);

    setEvents(eventList);
    setLoading(false);
  };

  useEffect(() => {
    fetchEvents();
  }, [selectedDate]);

  const parentEvents = events
    .filter((event) => event.parentEvent)
    .map((event) => {
      return event.parentEvent;
    });

  //const multiDayEvents = uniqBy(parentEvents, "id") as IEvent[];

  //const singleDayEvents = events.filter((event) => event.parentEvent == null);

  //const allEvents = [...multiDayEvents, ...singleDayEvents];

  const cells = useMemo(() => getCalendarCells(selectedDate), [selectedDate]);

  const eventPositions = useMemo(() => calculateEventPositions(events, selectedDate), [events, selectedDate]);

  return (
    <div>
      {isLoading ? <CalendarHeaderSkeleton view={"month"} /> : <CalendarHeader view={"month"} events={events} />}
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
              events={events}
              eventPositions={eventPositions}
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
