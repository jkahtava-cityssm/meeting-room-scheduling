import { useRouter } from "next/navigation";
import YearViewDayCell from "@/components/calendar/calendar-year-view-day-cell";

import React from "react";

import { navigateURL } from "@/lib/helpers";
import MonthViewDayCell from "./calendar-picker-month-day";
import { IMonthView } from "@/components/calendar/calendar-year-view";
import { addMonths, format, isSameMonth, startOfYear } from "date-fns";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { IconDot } from "@/components/ui/icon-dot";
import { TColors } from "@/lib/types";

//const YearViewDayCell = React.lazy(() => import("@/components/calendar/calendar-year-view-day-cell"));

export default function YearViewMonth({ selectedDate }: { selectedDate: Date }) {
  const { push } = useRouter();

  const weekDays = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

  const handleClick = () => {
    push(navigateURL(selectedDate, "month"));
  };

  const year = format(selectedDate, "yyyy");
  const month = format(selectedDate, "MMM");

  const monthList = getMonths(selectedDate);

  const view = "month";

  return (
    <div className="flex flex-col">
      <div className="flex items-center w-full justify-between mt-1">
        <Button
          variant={"outline"}
          className="h-7 w-7 bg-transparent p-1 m-2 ml-auto hover:opacity-100 [&_svg]:fill-foreground  shadow-xs"
          onClick={handleClick}
        >
          <ChevronLeft className={"h-4 w-4"}></ChevronLeft>
        </Button>
        <div className="flex items-center gap-1 2 ">
          <Button variant={"outline"} className="w-28" onClick={handleClick}>
            {month}
          </Button>
          <Button variant={"outline"} className="w-20" onClick={handleClick}>
            {year}
          </Button>
        </div>
        <Button
          variant={"outline"}
          className="h-7 w-7 bg-transparent p-1 m-2 mr-auto  hover:opacity-100 [&_svg]:fill-foreground  shadow-xs"
          onClick={handleClick}
        >
          <ChevronRight className={"h-4 w-4"}></ChevronRight>
        </Button>
      </div>

      <div className="flex-1 mx-8 pb-1 min-h-65">
        {view === "week" ? (
          <div className="grid grid-cols-7 gap-x-0.5 text-center mt-2">
            {weekDays.map((day, index) => (
              <div key={index} className="text-xs font-medium text-muted-foreground w-8 h-5">
                {day}
              </div>
            ))}
          </div>
        ) : (
          <div className="flex justify-center w-full mt-2">
            <div className="text-xs font-medium text-muted-foreground">Months</div>
          </div>
        )}

        <div className="grid grid-cols-4 gap-x-0.5 gap-y-2">
          {monthList.map((date, index) => {
            const month = format(date, "MMM");
            const isMonth = isSameMonth(date, selectedDate);
            return (
              <Button
                variant={"ghost"}
                key={index}
                onClick={handleClick}
                type="button"
                className={` size-14 p-2 ${isMonth && "bg-primary font-semibold text-primary-foreground"}`}
              >
                <div className="flex flex-col justify-center align-middle">
                  <div className={`flex size-6 items-center justify-center rounded-full text-xs font-medium`}>
                    {month}
                  </div>

                  <div className="mt-0.5 flex gap-0.5 h-3">
                    <div className="flex justify-center items-center">
                      <IconDot key={`day-${month}-${index}`} color={"red" as TColors}></IconDot>
                    </div>

                    <span className="text-[0.5rem] ">+ {4 - 1}</span>
                  </div>
                </div>
              </Button>
            );
            return <MonthViewDayCell key={`day-${day.day}`} day={day} />;
          })}
        </div>
      </div>
      <div className="bg-accent rounded-bl-sm rounded-br-sm  pl-3 pr-3">
        <Button variant={"outline"} size={"sm"} className="m-1" onClick={() => {}}>
          Today
        </Button>
      </div>
    </div>
  );
}

function getMonths(selectedDate: Date) {
  const yearStart = startOfYear(selectedDate);
  return Array.from({ length: 12 }, (_, i) => addMonths(yearStart, i));
}
