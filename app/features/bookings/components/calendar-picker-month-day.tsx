"use client";

import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

import { IconDot } from "@/components/ui/icon-dot";

import { navigateURL } from "@/lib/helpers";
import { TColors } from "@/lib/types";
import { IDayView } from "@/components/calendar/calendar-year-view";
import { format, isToday } from "date-fns";

const MonthViewDayCell = ({ date }: { date: Date }) => {
  const { push } = useRouter();

  const maxIndicators = 3;

  const handleClick = () => {
    push(navigateURL(date, "day"));
  };

  const today = isToday(date);
  const year = format(date, "yyyy");
  const month = format(date, "yyyy");

  return (
    <button
      onClick={handleClick}
      type="button"
      className="flex h-11 flex-1 flex-col items-center justify-start gap-0.5 rounded-md pt-1 hover:bg-accent focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
    >
      <div
        className={cn(
          "flex size-6 items-center justify-center rounded-full text-xs font-medium",
          today && "bg-primary font-semibold text-primary-foreground"
        )}
      >
        {date.day}
      </div>
      {
        <div className="mt-0.5 flex gap-0.5">
          {day.dayEvents.length <= maxIndicators ? (
            day.dayEvents.map((event, index) => (
              <IconDot key={`day-${day.day}-${event.eventId}-${index}`} color={event.room.color as TColors}></IconDot>
            ))
          ) : (
            <>
              <div className="flex justify-center items-center">
                <IconDot
                  key={`day-${day.day}-${day.dayEvents[0].eventId}`}
                  color={day.dayEvents[0].room.color as TColors}
                ></IconDot>
              </div>

              <span className="text-[0.5rem] ">+ {day.dayEvents.length - 1}</span>
            </>
          )}
        </div>
      }
    </button>
  );
};

export default MonthViewDayCell;
