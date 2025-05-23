import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { format, isSameDay, getDaysInMonth, startOfMonth } from "date-fns";
import { useCalendar } from "@/contexts/CalendarProvider";
import YearViewDayCell from "@/components/calendar/calendar-year-view-day-cell";

import React from "react";
import { YearViewMonthSkeleton } from "./skeleton-calendar-year-view-month-cell";
import { IEvent } from "@/lib/schemas/schemas";

//const YearViewDayCell = React.lazy(() => import("@/components/calendar/calendar-year-view-day-cell"));

export default function YearViewMonth({ month, events }: { month: Date; events: IEvent[] }) {
  const { push } = useRouter();
  const { setSelectedDate } = useCalendar();

  const [isLoading, setLoading] = useState(true);

  useEffect(() => {
    async function lazyLoad() {
      setLoading(false);
    }
    const timer = setTimeout(() => lazyLoad(), 10);

    return () => clearTimeout(timer);
  }, []);

  const monthName = format(month, "MMMM");

  const daysInMonth = useMemo(() => {
    const totalDays = getDaysInMonth(month);
    const firstDay = startOfMonth(month).getDay();

    const days = Array.from({ length: totalDays }, (_, i) => i + 1);
    const blanks = Array(firstDay).fill(null);

    return [...blanks, ...days];
  }, [month]);

  const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const handleClick = () => {
    setSelectedDate(new Date(month.getFullYear(), month.getMonth(), 1));
    push("month-view");
  };

  if (isLoading) {
    return <YearViewMonthSkeleton key={month.toString()}></YearViewMonthSkeleton>;
  }

  return (
    <div className="flex flex-col">
      <button
        type="button"
        onClick={handleClick}
        className="w-full rounded-t-lg border px-3 py-2 text-sm font-semibold hover:bg-accent focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
      >
        {monthName}
      </button>

      <div className="flex-1 space-y-2 rounded-b-lg border border-t-0 p-3">
        <div className="grid grid-cols-7 gap-x-0.5 text-center">
          {weekDays.map((day, index) => (
            <div key={index} className="text-xs font-medium text-muted-foreground">
              {day}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-x-0.5 gap-y-2">
          {daysInMonth.map((day, index) => {
            if (day === null) return <div key={`blank-${index}`} className="h-10" />;
            return <YearViewDayCell key={`day-${day}`} day={day} month={month} events={events} />;
          })}
        </div>
      </div>
    </div>
  );
}
