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

import { YearViewMonthSkeleton } from "./skeleton-calendar-year-view-month-cell";
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

function getMonths(selectedDate: Date) {
  const yearStart = startOfYear(selectedDate);
  return Array.from({ length: 12 }, (_, i) => addMonths(yearStart, i));
}

function getDays(selectedDate: Date) {
  const totalDays = getDaysInMonth(selectedDate);
  const firstDay = startOfMonth(selectedDate).getDay();

  const days: number[] = Array.from({ length: totalDays }, (_, i) => i + 1);

  const blanks: number[] = Array.from({ length: firstDay }, (_, i) => i * -1).reverse();
  return [...blanks, ...days];
}

function getSelectedDate(selectedDate: string | null) {
  return selectedDate !== null ? startOfYear(parse(selectedDate, "yyyy", new Date())) : startOfYear(new Date());
}

export function CalendarYearView() {
  const searchParams = useSearchParams();
  const { push } = useRouter();

  const value = searchParams.get("selectedDate");
  const selectedDate = getSelectedDate(value);

  const { selectedRoomId, visibleHours } = useCalendar();
  const [monthViews, setMonthViews] = useState<MonthView[]>([]);
  const [pendingRecord, setPendingRecord] = useState({ isPending: true, currentDate: selectedDate });
  const [filteredEvents, setFilteredEvents] = useState<IEvent[]>([]);

  const startDate: Date = startOfYear(selectedDate);
  const endDate: Date = endOfYear(selectedDate);

  const { data: events, isLoading } = useSWR<IEvent[]>(
    `/api/events?startdate=${startDate.toISOString()}&enddate=${endDate.toISOString()}`
  );

  const { data: recurringEvents } = useSWR<IEvent[]>(
    `/api/recurrences?startdate=${startDate.toISOString()}&enddate=${endDate.toISOString()}`
  );

  useEffect(() => {
    async function formatYearData(
      eventList: IEvent[],
      recurringEventList: IEvent[],
      selectedDate: Date,
      selectedRoomId: string
    ) {
      const combinedEvents: IEvent[] = [
        ...generateMultiDayEventsInPeriod(eventList, startDate, endDate, visibleHours),
        ...generateRecurringEventsInPeriod(recurringEventList, startDate, endDate),
      ];
      const filteredEvents: IEvent[] = filterEventsByRoom(combinedEvents, selectedRoomId);

      const monthData: MonthView[] = [];
      const months: Date[] = getMonths(selectedDate);

      months.forEach((month, index) => {
        const days: number[] = getDays(month);
        const yearValue = month.getFullYear();
        const monthValue = month.getMonth();

        const dayData: DayView[] = [];

        days.forEach((day, index) => {
          if (day <= 0) {
            dayData.push({ day: day, dayDate: new Date(0), isBlank: true, isToday: false, dayEvents: [] });
            return;
          }

          const date: Date = new Date(yearValue, monthValue, day);
          const today: boolean = isToday(date);
          const events: IEvent[] = filteredEvents.filter((event) => isSameDay(event.startDate, date));

          dayData.push({ day: day, dayDate: date, isBlank: false, isToday: today, dayEvents: events });
        });

        monthData.push({ month: index, monthDate: month, monthName: format(month, "MMMM"), days: dayData });
      });

      setFilteredEvents(filteredEvents);
      setMonthViews(monthData);
      setPendingRecord({ isPending: false, currentDate: selectedDate });
    }

    if (events && recurringEvents) {
      formatYearData(events, recurringEvents, startDate, selectedRoomId);
    }
  }, [events, recurringEvents, value, selectedRoomId]);

  const handleNavigatePrevious = () => {
    const previousDate = navigateDate(selectedDate, "year", "previous");
    setPendingRecord({ isPending: true, currentDate: previousDate });

    push(navigateURL(previousDate, "year"));
  };

  const handleNavigateNext = () => {
    const nextDate = navigateDate(selectedDate, "year", "next");
    setPendingRecord({ isPending: true, currentDate: nextDate });

    push(navigateURL(nextDate, "year"));
  };

  const handleNavigateRoomChange = (value: string) => {
    console.log(isLoading);
  };

  if (pendingRecord.isPending) {
    return (
      <>
        <CalendarHeader
          view={"year"}
          selectedDate={pendingRecord.currentDate}
          events={filteredEvents}
          isLoading={pendingRecord.isPending}
          onPreviousClick={handleNavigatePrevious}
          onNextClick={handleNavigateNext}
          onRoomChange={handleNavigateRoomChange}
        />
        <div className="p-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {getMonths(pendingRecord.currentDate).map((month) => {
              return (
                <YearViewMonthSkeleton
                  key={month.toString()}
                  totalDays={getDays(month).length}
                  month={month}
                ></YearViewMonthSkeleton>
              );
            })}
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <CalendarHeader
        view={"year"}
        selectedDate={pendingRecord.currentDate}
        events={filteredEvents}
        isLoading={pendingRecord.isPending}
        onPreviousClick={handleNavigatePrevious}
        onNextClick={handleNavigateNext}
        onRoomChange={handleNavigateRoomChange}
      />
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
