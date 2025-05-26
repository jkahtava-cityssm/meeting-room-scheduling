"use client";

import { format, isSameDay, isToday } from "date-fns";
import { useRouter } from "next/navigation";
import { useCalendar } from "@/contexts/CalendarProvider";
import { cn } from "@/lib/utils";

import { IconDot } from "@/components/ui/icon-dot";
import { TColors } from "../../lib/types";
import { useEffect, useState } from "react";
import { Skeleton } from "../ui/skeleton";
import { IEvent } from "@/lib/schemas/schemas";
import { DayView } from "./calendar-year-view";

const YearViewDayCell = ({ day }: { day: DayView }) => {
  const { push } = useRouter();
  const { setSelectedDate } = useCalendar();

  const maxIndicators = 3;

  const handleClick = () => {
    //setSelectedDate(day.dayDate);
    push(`day-view?selectedDate=${format(day.dayDate, "yyyy-MM-dd")}`);
  };

  return (
    <button
      onClick={handleClick}
      type="button"
      className="flex h-11 flex-1 flex-col items-center justify-start gap-0.5 rounded-md pt-1 hover:bg-accent focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
    >
      <div
        className={cn(
          "flex size-6 items-center justify-center rounded-full text-xs font-medium",
          day.isToday && "bg-primary font-semibold text-primary-foreground"
        )}
      >
        {day.day}
      </div>
      {
        <div className="mt-0.5 flex gap-0.5">
          {day.dayEvents.length <= maxIndicators ? (
            day.dayEvents.map((event, index) => (
              <IconDot key={`day-${day.day}-${event.eventId}-${index}`} color={event.room.color as TColors}></IconDot>
            ))
          ) : (
            <>
              <IconDot
                key={`day-${day.day}-${day.dayEvents[0].eventId}`}
                color={day.dayEvents[0].room.color as TColors}
              ></IconDot>
              <span className="text-[7px] text-muted-foreground">+{day.dayEvents.length - 1}</span>
            </>
          )}
        </div>
      }
    </button>
  );
};

export default YearViewDayCell;
