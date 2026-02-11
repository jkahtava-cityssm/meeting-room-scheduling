"use client";

import { TCalendarView } from "@/lib/types";

import { useMemo } from "react";

import { redirect, useSearchParams } from "next/navigation";
import { parse } from "date-fns";

import { useSession } from "@/contexts/SessionProvider";
import { GroupedPermissionRequirement } from "@/lib/auth-permission-checks";
import { useVerifySessionRequirement } from "@/lib/auth-client";

import { Terminal } from "lucide-react";

import { CalendarDayColumnCalendar } from "@/app/features/calendar/sidebar-day-picker/calendar-day-column-calendar";
import { useSidebar } from "@/components/ui/sidebar";
import { CalendarDayView } from "../view-day/calendar-day-view";
import { CalendarMonthView } from "@/app/features/calendar/view-month/calendar-month-view";
import { CalendarWeekView } from "@/app/features/calendar/view-week/calendar-week-view";
import { CalendarYearView } from "@/app/features/calendar/view-year/calendar-year-view";
import { CalendarAgendaView } from "@/app/features/calendar/view-agenda/calendar-agenda-view";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { CalendarHeader } from "./calendar-all-header";
import { CalendarPermissions } from "../permissions/calendar.permissions";
import { cn } from "@/lib/utils";

function getViewDate(dateParam: string | null) {
  return dateParam === null ? removeTimeFromDate(new Date()) : parse(dateParam, "yyyy-MM-dd", new Date());
}

function removeTimeFromDate(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export function CalendarAllViews({ userId }: { userId?: string }) {
  const searchParams = useSearchParams();
  const dateParam = searchParams.get("selectedDate");
  const viewParam = searchParams.get("view");

  const view = viewParam === null ? "day" : viewParam;

  const dateValue = useMemo(() => {
    return getViewDate(dateParam);
  }, [dateParam]);

  const { can, canAny } = CalendarPermissions.usePermissions();

  const viewDay = userId ? can("ViewMyBookingDay") : can("ViewCalendarDay");
  const viewMonth = userId ? can("ViewMyBookingMonth") : can("ViewCalendarMonth");
  const viewWeek = userId ? can("ViewMyBookingWeek") : can("ViewCalendarWeek");
  const viewYear = userId ? can("ViewMyBookingYear") : can("ViewCalendarYear");
  const viewAgenda = userId ? can("ViewMyBookingAgenda") : can("ViewCalendarAgenda");

  const hasAccess = canAny(viewDay, viewMonth, viewWeek, viewYear, viewAgenda);

  if (!hasAccess) {
    return <RequirePermission allowed={hasAccess}></RequirePermission>;
  }

  return (
    <div className="overflow-hidden rounded-xl border min-w-92 flex flex-1 flex-col">
      <CalendarHeader
        view={view as TCalendarView}
        selectedDate={dateValue}
        userId={userId}
        permissions={{ day: viewDay, month: viewMonth, week: viewWeek, year: viewYear, agenda: viewAgenda }}
      />

      {view === "day" && (
        <RequirePermission allowed={viewDay}>
          <CalendarDayView date={dateValue} userId={userId} />
        </RequirePermission>
      )}
      {view === "month" && (
        <RequirePermission allowed={viewMonth}>
          <CalendarMonthView key={dateValue.toISOString()} date={dateValue} userId={userId} />
        </RequirePermission>
      )}
      {view === "week" && (
        <RequirePermission allowed={viewWeek}>
          <CalendarWeekView date={dateValue} userId={userId} />
        </RequirePermission>
      )}
      {view === "year" && (
        <RequirePermission allowed={viewYear}>
          <CalendarYearView date={dateValue} userId={userId} />
        </RequirePermission>
      )}
      {view === "agenda" && (
        <RequirePermission allowed={viewAgenda}>
          <CalendarAgendaView date={dateValue} userId={userId} />
        </RequirePermission>
      )}
    </div>
  );
}

export function RequirePermission({
  allowed,
  title,
  message,
  children,
}: {
  allowed: boolean;
  title?: string;
  message?: string;
  children?: React.ReactNode;
}) {
  if (allowed) return <>{children}</>;
  return (
    <div className="flex flex-1 min-h-0">
      <div className={cn("flex flex-col min-h-0  min-w-0 transition-[width] duration-600 ease-in-out flex-1 p-4")}>
        <Alert variant="destructive" className="mt-4 ">
          <Terminal className="h-4 w-4" />
          <AlertTitle>{title ? title : "Permission Denied"}</AlertTitle>
          <AlertDescription>{message ? message : "You do not have permission to view this content"}</AlertDescription>
        </Alert>
      </div>
    </div>
  );
}

export function CalendarAccessDenied({
  currentDate,
  title,
  description,
  children,
}: {
  currentDate: Date;
  title?: string;
  description?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex">
      <div className="flex flex-1 flex-col">
        {children}

        <div className="flex h-full border-l">
          <div className="w-18 border-r"></div>
          <div className="relative flex-1 border-b p-4">
            <Alert variant="destructive" className="mt-4 ">
              <Terminal className="h-4 w-4" />
              <AlertTitle>{title ? title : "Error"}</AlertTitle>
              <AlertDescription>
                {description ? description : "You do not have permission to view these events."}
              </AlertDescription>
            </Alert>
          </div>
        </div>
      </div>
      <CalendarDayColumnCalendar
        date={currentDate}
        isLoading={false}
        events={[]}
        view={"day"}
      ></CalendarDayColumnCalendar>
    </div>
  );
}

export function CalendarEmptyAlert({
  currentDate,
  title,
  description,
  children,
}: {
  currentDate: Date;
  title?: string;
  description?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex">
      <div className="flex flex-1 flex-col">
        {children}

        <div className="flex h-full border-l">
          <div className="w-18 border-r"></div>
          <div className="relative flex-1 border-b p-4">
            <Alert variant="destructive" className="mt-4 ">
              <Terminal className="h-4 w-4" />
              <AlertTitle>{title ? title : "Empty"}</AlertTitle>
              <AlertDescription>{description ? description : "No Data was Found"}</AlertDescription>
            </Alert>
          </div>
        </div>
      </div>
      <CalendarDayColumnCalendar
        date={currentDate}
        isLoading={false}
        events={[]}
        view={"day"}
      ></CalendarDayColumnCalendar>
    </div>
  );
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
