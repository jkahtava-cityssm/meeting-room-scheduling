import { IEvent } from "@/lib/schemas/schemas";
import { generateMultiDayEventsInPeriod, generateRecurringEventsInPeriod } from "@/services/events";
import { addMonths, endOfYear, format, getDaysInMonth, isSameDay, isToday, startOfMonth, startOfYear } from "date-fns";
import { DayView, MonthView, YearProcessData, YearResponseData } from "./calendar-year-view";
import { filterEventsByRoom } from "../../lib/helpers";

self.onmessage = (event: MessageEvent<YearProcessData>) => {
  if (event.data) {
    const result = formatYearData(event.data);
    self.postMessage(result);
  }
};

function formatYearData(yearData: YearProcessData): YearResponseData {
  const startDate: Date = startOfYear(yearData.selectedDate);
  const endDate: Date = endOfYear(yearData.selectedDate);

  const combinedEvents: IEvent[] = [
    ...generateMultiDayEventsInPeriod(yearData.eventList, startDate, endDate, yearData.visibleHours),
    ...generateRecurringEventsInPeriod(yearData.recurringEventList, startDate, endDate),
  ];
  const filteredEvents: IEvent[] = filterEventsByRoom(combinedEvents, yearData.selectedRoomId);

  const monthData: MonthView[] = [];
  const months: Date[] = getMonths(yearData.selectedDate);

  months.forEach((month, monthIndex) => {
    const days: number[] = getDays(month);
    const yearValue = month.getFullYear();
    const monthValue = month.getMonth();

    const dayData: DayView[] = [];

    days.forEach((day) => {
      if (day <= 0) {
        dayData.push({ day: day, dayDate: new Date(0), isBlank: true, isToday: false, dayEvents: [] });
        return;
      }

      const date: Date = new Date(yearValue, monthValue, day);
      const today: boolean = isToday(date);
      const events: IEvent[] = filteredEvents.filter((event) => isSameDay(event.startDate, date));

      dayData.push({ day: day, dayDate: date, isBlank: false, isToday: today, dayEvents: events });
    });

    monthData.push({ month: monthIndex, monthDate: month, monthName: format(month, "MMMM"), days: dayData });
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
