"use client";

import { useEffect, useMemo, useState } from "react";

import { useCalendar } from "@/contexts/CalendarProvider";

import { MonthViewDayCell } from "@/components/calendar/calendar-month-view-day-cell";

import { filterEventsByRoom, getCalendarCells, MAX_VISIBLE_EVENTS } from "@/lib/helpers";

import {
  differenceInDays,
  eachDayOfInterval,
  endOfMonth,
  endOfYear,
  isSameDay,
  isToday,
  parse,
  parseISO,
  parseJSON,
  startOfDay,
  startOfMonth,
  startOfYear,
} from "date-fns";

import { CalendarHeader } from "./calendar-all-header";
import { MonthViewDayCellSkeleton } from "./skeleton-calendar-month-day-cell";

import { useAllMonthlyEvents } from "@/services/events";
import { IEvent, SEvent } from "@/lib/schemas/schemas";
import { useSearchParams } from "next/navigation";
import useSWR from "swr";
import { z } from "zod";

export interface MonthProcessData {
  events: IEvent[];
  selectedDate: Date;
  selectedRoomId: string;
}

const WEEK_DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function CalendarMonthView({ date }: { date: Date }) {
  const startDate: Date = startOfMonth(date);
  const endDate: Date = endOfMonth(date);

  const { selectedRoomId, setTotalEvents, setIsHeaderLoading } = useCalendar();

  const [filteredEvents, setFilteredEvents] = useState<IEvent[]>([]);
  const [eventPositions, setEventPositions] = useState<{
    [key: string]: number;
  }>({});

  const [dayList, setDayList] = useState<DayView[]>([]);

  const [isLoading, setLoading] = useState(true);
  const [isRefreshed, setRefreshed] = useState(false);

  const { data: events, isLoading: isPending } = useSWR<IEvent[]>(
    `/api/calendar?startdate=${startDate.toISOString()}&enddate=${endDate.toISOString()}`
  );

  const cells = useMemo(() => getCalendarCells(date), [date]);

  useEffect(() => {
    setRefreshed(true);
  }, []);

  useEffect(() => {
    if (!events) {
      return;
    }
    /*const filteredEvents = filterEventsByRoom(events, selectedRoomId);
    const eventPositions = calculateEventPositions({
      events: filteredEvents,
      selectedDate: date,
      selectedRoomId: selectedRoomId,
    });*/
    const dayList = processMonthEvents({ events: events, selectedDate: date, selectedRoomId: selectedRoomId });
    setDayList(dayList);
    //setEventPositions(eventPositions);
    //setFilteredEvents(filteredEvents);
    setTotalEvents(filteredEvents.length);
    setIsHeaderLoading(false);
    setLoading(false);
  }, [events, date, selectedRoomId, isRefreshed]);

  if (isLoading || isPending) {
    return <MonthViewDayCellSkeleton date={date} />;
  }

  return (
    <>
      <div className="grid grid-cols-7 divide-x">
        {WEEK_DAYS.map((day) => (
          <div key={day} className="flex items-center justify-center py-2">
            <span className="text-xs font-medium text-muted-foreground">{day}</span>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 overflow-hidden">
        {dayList.map((day) => (
          <MonthViewDayCell key={day.dayDate.toISOString()} dayRecord={day} />
        ))}
      </div>
    </>
  );
}

export interface DayView {
  day: number;
  dayDate: Date;
  isToday: boolean;
  eventRecords: EventView[];
}

export interface EventView {
  position: number;
  event: IEvent | null;
}

function processMonthEvents(monthData: MonthProcessData) {
  const monthStart = startOfMonth(monthData.selectedDate);
  const monthEnd = endOfMonth(monthData.selectedDate);

  const events = z.array(SEvent).parse(monthData.events);
  const listOfDaysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const { eventOrder, totalEvents } = calculateEventPositions(monthStart, monthEnd, listOfDaysInMonth, events);

  const dayViews: DayView[] = [];

  listOfDaysInMonth.forEach((day, index) => {
    //const eventViews: EventView[] = [];
    const currentEvents = events.filter((event) => {
      return isSameDay(event.startDate, day);
    });

    const sortedEvents = currentEvents.sort((a, b) => a.startDate.getTime() - b.startDate.getTime());

    const eventViews: EventView[] = sortedEvents.map((event, index) => {
      return { position: !eventOrder[event.eventId] ? -1 : eventOrder[event.eventId], event: event };
    });

    /*
        const eventViews: EventView[] = sortedEvents.map((event, index) => {
      return { position: index, event: event };
    });
    */
    const postitionArray = eventViews.map((record) => {
      return record.position;
    });

    const maxPosition = Math.max(...postitionArray);

    for (let index = 0; index < maxPosition; index++) {
      if (postitionArray.indexOf(index) === -1) {
        eventViews.push({ position: index, event: null });
      }
    }

    const sortedEvents2 = eventViews.sort((firstEvent, secondEvent) => {
      return firstEvent.position - secondEvent.position;
    });

    dayViews.push({ day: day.getDate(), dayDate: day, eventRecords: sortedEvents2, isToday: isToday(day) });
  });

  return dayViews;
}

function calculateEventPositions(monthStart: Date, monthEnd: Date, listOfDaysInMonth: Date[], events: IEvent[]) {
  const multiDayEvents = events.filter((event: IEvent) => {
    return event.isMultipleDays;
  });

  /*const singleDayEvents = events.filter((event: IEvent) => {
    return isSameDay(event.startDate, event.endDate);
  });
*/
  const eventPositions: { [key: string]: number } = {};
  const occupiedPositions: { [key: string]: boolean[] } = {};

  const maxEvents = getMaxEventsInDay(listOfDaysInMonth, events);
  //FILL OCCUPIED POSITIONS WITH EVERY DATE BETWEEN START AND END
  listOfDaysInMonth.forEach((day) => {
    //occupiedPositions[day.toISOString()] = [false, false, false];
    occupiedPositions[day.toISOString()] = [
      ...Array(maxEvents)
        .keys()
        .map(() => {
          return false;
        }),
    ];
  });

  //SORT ALL THE EVENTS
  const sortedEvents = [
    ...multiDayEvents.sort((firstEvent, secondEvent) => {
      const aDuration = differenceInDays(firstEvent.endDate, firstEvent.startDate);
      const bDuration = differenceInDays(secondEvent.endDate, secondEvent.startDate);

      const firstEventTime = firstEvent.startDate.getTime();
      const secondEventTime = secondEvent.startDate.getTime();
      return bDuration - aDuration || firstEventTime - secondEventTime;
    }),
    //...singleDayEvents.sort((a, b) => a.startDate.getTime() - b.startDate.getTime()),
  ];
  /*
  const MultiEventDays = [];

  multiDayEvents.forEach((multiEvent) => {
    const multiInDay = multiDayEvents.filter((event: IEvent) => {
      return isSameDay(event.startDate, multiEvent.startDate);
    });

    const singleInDay = singleDayEvents.filter((event: IEvent) => {
      return isSameDay(event.startDate, multiEvent.startDate);
    });

    const sortedEvents = [
      ...multiInDay.sort((firstEvent, secondEvent) => {
        const aDuration = differenceInDays(firstEvent.endDate, firstEvent.startDate);
        const bDuration = differenceInDays(secondEvent.endDate, secondEvent.startDate);

        const firstEventTime = firstEvent.startDate.getTime();
        const secondEventTime = secondEvent.startDate.getTime();
        return bDuration - aDuration || firstEventTime - secondEventTime;
      }),
      ...singleInDay.sort((a, b) => a.startDate.getTime() - b.startDate.getTime()),
    ];

    MultiEventDays.push({ day: multiEvent.startDate, events: sortedEvents });
  });
  console.log(MultiEventDays);
  */
  /*
  FILL ALL THE MULTI DAY EVENTS FIRST?
  THEN ADD ALL THE SINGLE DAY EVENTS WHERE A MULTI DAY EVENT EXISTS?
  SORT THE DAYS
  FIND WHERE THE MULTIDAY EVENTS OCCUR AND SET THOSE TO BE THE POSITIONS AND THEN WORK AROUND THEM?
  */

  sortedEvents.forEach((event) => {
    const eventStart = event.startDate;
    const eventEnd = event.endDate;

    const eventDays = eachDayOfInterval({
      start: eventStart < monthStart ? monthStart : eventStart,
      end: eventEnd > monthEnd ? monthEnd : eventEnd,
    });

    let position = -1;

    for (let i = 0; i < maxEvents; i++) {
      if (
        eventDays.every((day) => {
          //LOOKUP IF THE OCCUPIED POSITION IS FOUND
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

  return { eventOrder: eventPositions, totalEvents: maxEvents };
}

function getMaxEventsInDay(listOfDaysInMonth: Date[], events: IEvent[]) {
  let totalEventsInDay = 0;

  listOfDaysInMonth.forEach((day) => {
    const totalEventToday = events.filter((event: IEvent) => {
      return isSameDay(day, event.startDate);
    }).length;

    if (totalEventToday > totalEventsInDay) {
      totalEventsInDay = totalEventToday;
    }
  });

  return totalEventsInDay;
}
