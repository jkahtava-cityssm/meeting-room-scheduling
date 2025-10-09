"use client";

import { TCalendarView } from "@/lib/types";
import { CalendarDayView } from "./calendar-day-view";
import { CalendarMonthView } from "./calendar-month-view";
import { CalendarWeekView } from "./calendar-week-view";
import { CalendarYearView } from "./calendar-year-view";
import { CalendarAgendaView } from "./calendar-agenda-view";
import { CalendarHeader } from "./calendar-all-header";
import { useMemo } from "react";

import { redirect, useSearchParams } from "next/navigation";
import { endOfDay, endOfWeek, parse, startOfDay, startOfMonth, startOfWeek, startOfYear } from "date-fns";

import { useEventsQuery } from "@/services/events";
import { useUserEventsQuery } from "@/services/users";
import { useClientSession } from "@/hooks/use-client-auth";
//import { hasPermission } from "@/lib/auth";

function getViewDate(dateParam: string | null, view: string) {
  return dateParam === null ? removeTimeFromDate(new Date()) : parse(dateParam, "yyyy-MM-dd", new Date());
}

function removeTimeFromDate(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

/*function isView(value: unknown): value is TCalendarView {
  return typeof value === "string" && TCalendarView.includes(value);
}*/

export function CalendarAllViews({ userId }: { userId?: string }) {
  const searchParams = useSearchParams();
  const dateParam = searchParams.get("selectedDate");
  const viewParam = searchParams.get("view");

  const view = viewParam === null ? "day" : viewParam;

  const dateValue = useMemo(() => {
    return getViewDate(dateParam, view);
  }, [dateParam, view]);

  const { session, isPending } = useClientSession();

  if (isPending) {
    return <div>Verifying Access</div>;
  }

  if (!session) {
    //console.log("Calendar-All-Views No session, redirecting to login");
    redirect("/");
  }

  if (session) {
    return (
      <div className="overflow-hidden rounded-xl border min-w-92">
        <CalendarHeader view={view as TCalendarView} selectedDate={dateValue} userId={userId} />

        {view === "day" && <CalendarDayView date={dateValue} userId={userId} />}
        {view === "month" && <CalendarMonthView date={dateValue} userId={userId} />}
        {view === "week" && <CalendarWeekView date={dateValue} userId={userId} />}
        {view === "year" && <CalendarYearView date={dateValue} userId={userId} />}
        {view === "agenda" && <CalendarAgendaView date={dateValue} userId={userId} />}
      </div>
    );
  }
}

/*function CalendarDayViewWithAllEvents({ date }: { date: Date }) {
  const startDate: Date = startOfDay(date);
  const endDate: Date = endOfDay(date);

  const { data: events } = useEventsQuery(startDate, endDate);
  return <CalendarDayView date={date} events={events} />;
}

function CalendarDayViewWithUserEvents({ date }: { date: Date }) {
  const startDate: Date = startOfDay(date);
  const endDate: Date = endOfDay(date);

  const { data: events } = useUserEventsQuery("201");
  return <CalendarDayView date={date} events={events} />;
}
*/
