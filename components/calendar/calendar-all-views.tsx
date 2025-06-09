"use client";

import { TCalendarView } from "@/lib/types";
import { CalendarDayView } from "./calendar-day-view";
import { CalendarMonthView } from "./calendar-month-view";
import { CalendarWeekView } from "./calendar-week-view";
import { CalendarYearView } from "./calendar-year-view";
import { CalendarAgendaView } from "./calendar-agenda-view";
import { CalendarHeader } from "./calendar-all-header";
import { useEffect } from "react";

import { useSearchParams } from "next/navigation";
import { endOfWeek, parse, startOfDay, startOfMonth, startOfYear } from "date-fns";

function getViewDate(dateParam: string | null, view: string) {
  switch (view) {
    case "agenda":
    case "day":
      return dateParam === null ? startOfDay(new Date()) : startOfDay(parse(dateParam, "yyyy-MM-dd", new Date()));
    case "week":
      console.log(dateParam);
      return dateParam === null ? endOfWeek(new Date()) : endOfWeek(parse(dateParam, "RRRR-II", new Date()));
    case "month":
      return dateParam === null ? startOfMonth(new Date()) : startOfMonth(parse(dateParam, "yyyy-MM", new Date()));
    case "year":
      return dateParam === null ? startOfYear(new Date()) : startOfYear(parse(dateParam, "yyyy", new Date()));
    default:
      return dateParam === null ? startOfDay(new Date()) : startOfDay(parse(dateParam, "yyyy", new Date()));
  }
}

/*function isView(value: unknown): value is TCalendarView {
  return typeof value === "string" && TCalendarView.includes(value);
}*/

export function CalendarAllViews() {
  const searchParams = useSearchParams();

  const dateParam = searchParams.get("selectedDate");
  const viewParam = searchParams.get("view");

  const view = viewParam === null ? "day" : viewParam;
  const dateValue = getViewDate(dateParam, view);

  useEffect(() => {
    //setIsLoading(true);
  }, [viewParam, dateParam]);

  return (
    <div className="overflow-hidden rounded-xl border min-w-92">
      <CalendarHeader view={view as TCalendarView} selectedDate={dateValue} />

      {view === "day" && <CalendarDayView date={dateValue} />}
      {view === "month" && <CalendarMonthView date={dateValue} />}
      {view === "week" && <CalendarWeekView date={dateValue} />}
      {view === "year" && <CalendarYearView date={dateValue} />}
      {view === "agenda" && <CalendarAgendaView date={dateValue} />}
    </div>
  );
}
