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
import { parse } from "date-fns";

import { useClientSession } from "@/hooks/use-client-auth";
import { GroupedPermissionRequirement } from "@/lib/auth-permission-checks";
import { useVerifySessionRequirement } from "@/lib/auth-client";
import { CalendarDayColumnCalendar } from "./calendar-day-column-calendar";
import { Button } from "../ui/button";
import { Alert, AlertDescription, AlertTitle } from "../ui/alert";
import { Terminal } from "lucide-react";
import { DayViewDayHeader } from "./calendar-day-view-day-header";
import { useSidebar } from "../ui/sidebar";
//import { hasPermission } from "@/lib/auth";

function getViewDate(dateParam: string | null) {
  return dateParam === null ? removeTimeFromDate(new Date()) : parse(dateParam, "yyyy-MM-dd", new Date());
}

function removeTimeFromDate(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

const PAGE_PERMISSIONS = {
  CreateEvent: { type: "permission", resource: "Event", action: "Create" },
  AllowDayView: { type: "permission", resource: "Calendar", action: "View Day" },
  AllowWeekView: { type: "permission", resource: "Calendar", action: "View Week" },
  AllowMonthView: { type: "permission", resource: "Calendar", action: "View Month" },
  AllowYearView: { type: "permission", resource: "Calendar", action: "View Year" },
  AllowAgendaView: { type: "permission", resource: "Calendar", action: "View Agenda" },
} as const;

export function CalendarAllViews({ userId }: { userId?: string }) {
  const searchParams = useSearchParams();
  const dateParam = searchParams.get("selectedDate");
  const viewParam = searchParams.get("view");

  const view = viewParam === null ? "day" : viewParam;

  const dateValue = useMemo(() => {
    return getViewDate(dateParam);
  }, [dateParam]);

  console.log(dateValue);

  const { session, isPending } = useClientSession();

  const Permissions = useVerifySessionRequirement(session, PAGE_PERMISSIONS);

  const { open, openMobile, isMobile } = useSidebar();

  if (isPending) {
    return <div>Verifying Access</div>;
  }

  if (!session) {
    //console.log("Calendar-All-Views No session, redirecting to login");
    redirect("/");
  }

  if (session) {
    return (
      <div className="overflow-hidden rounded-xl border min-w-92 flex flex-1 flex-col">
        <CalendarHeader
          view={view as TCalendarView}
          selectedDate={dateValue}
          userId={userId}
          allowCreateEvent={Permissions.CreateEvent}
        />

        {view === "day" && (
          <CalendarDayView
            date={dateValue}
            userId={userId}
            //allowDayView={Permissions.AllowDayView}
            allowCreateEvent={Permissions.CreateEvent}
            isSidebarOpen={open}
          />
        )}
        {view === "month" && <CalendarMonthView date={dateValue} userId={userId} />}
        {view === "week" && <CalendarWeekView date={dateValue} userId={userId} />}
        {view === "year" && <CalendarYearView date={dateValue} userId={userId} />}
        {view === "agenda" && <CalendarAgendaView date={dateValue} userId={userId} />}
      </div>
    );
  }
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
