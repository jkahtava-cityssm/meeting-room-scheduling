import { useRouter } from "next/navigation";
import YearViewDayCell from "@/components/calendar/calendar-year-view-day-cell";

import React from "react";

import { IMonthView } from "./calendar-year-view";
import { navigateURL } from "@/lib/helpers";

//const YearViewDayCell = React.lazy(() => import("@/components/calendar/calendar-year-view-day-cell"));

export default function YearViewMonth({ month }: { month: IMonthView }) {
  const { push } = useRouter();

  const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const handleClick = () => {
    push(navigateURL(month.monthDate, "month"));
  };

  return (
    <div className="flex flex-col">
      <button
        type="button"
        onClick={handleClick}
        className="w-full rounded-t-lg border px-3 py-2 text-sm font-semibold hover:bg-accent focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
      >
        {month.monthName}
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
          {month.days.map((day, index) => {
            if (day.isBlank) return <div key={`blank-${index}`} className="h-10" />;
            return <YearViewDayCell key={`day-${day.day}`} day={day} />;
          })}
        </div>
      </div>
    </div>
  );
}
