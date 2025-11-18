import { IEvent, SEvent } from "@/lib/schemas/calendar";

import { addMonths, endOfYear, format, getDaysInMonth, isToday, startOfMonth, startOfYear } from "date-fns";
import { IDayView, IMonthView, IYearProcessData, IYearResponseData } from "../calendar-year-view";
import { filterEventsByRoom } from "@/lib/helpers";

import z from "zod/v4";
import { generateMultiDayEventsInPeriod, generateRecurringEventsInPeriod } from "@/lib/event-helpers";

self.onmessage = async (event: MessageEvent<IYearProcessData>) => {
  if (event.data) {
    const result = await formatYearData(event.data);
    self.postMessage(result);
  }
};

async function formatYearData(yearData: IYearProcessData): Promise<IYearResponseData> {
  const startDate: Date = startOfYear(yearData.selectedDate);
  const endDate: Date = endOfYear(yearData.selectedDate);

    const fromTime = yearData.visibleHours.from
  const toTime = yearData.visibleHours.to

  const [multiDayEvents, recurringEvents] = await Promise.all([
    Promise.resolve(generateMultiDayEventsInPeriod(yearData.eventList, startDate, endDate, fromTime,toTime)),
    Promise.resolve(generateRecurringEventsInPeriod(yearData.eventList, startDate, endDate)),
  ]);

  const combinedEvents: IEvent[] = [...multiDayEvents, ...recurringEvents];

  const events = z.array(SEvent).parse(combinedEvents);

  const filteredEvents: IEvent[] = filterEventsByRoom(events, yearData.selectedRoomId).sort(
    (a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
  );

  const eventsByDate = new Map<string, IEvent[]>();
  filteredEvents.forEach((event) => {
    const key = format(event.startDate, "yyyy-MM-dd");
    if (!eventsByDate.has(key)) eventsByDate.set(key, []);
    eventsByDate.get(key)!.push(event);
  });

  const months: Date[] = getMonths(yearData.selectedDate);

  const monthData: IMonthView[] = months.map((month, monthIndex) => {
    const days: number[] = getDays(month);
    const yearValue = month.getFullYear();
    const monthValue = month.getMonth();

    const dayData: IDayView[] = days.map((day) => {
      if (day <= 0) {
        return { day, dayDate: new Date(0), isBlank: true, isToday: false, dayEvents: [] };
      }

      const date = new Date(yearValue, monthValue, day);
      const key = format(date, "yyyy-MM-dd");
      const events = eventsByDate.get(key) || [];

      return {
        day,
        dayDate: date,
        isBlank: false,
        isToday: isToday(date),
        dayEvents: events,
      };
    });

    return { month: monthIndex, monthDate: month, monthName: format(month, "MMMM"), days: dayData };
  });

  return { totalEvents: filteredEvents.length, monthsViews: monthData };
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
