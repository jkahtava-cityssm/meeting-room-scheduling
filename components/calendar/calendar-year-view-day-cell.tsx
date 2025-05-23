"use client";

import { isSameDay, isToday } from "date-fns";
import { useRouter } from "next/navigation";
import { useCalendar } from "@/contexts/CalendarProvider";
import { cn } from "@/lib/utils";

import { IconDot } from "@/components/ui/icon-dot";
import { TColors } from "../../lib/types";
import { useEffect, useState } from "react";
import { Skeleton } from "../ui/skeleton";
import { IEvent } from "@/lib/schemas/schemas";

interface IProps {
  day: number;
  month: Date;
  events: IEvent[];
}

const YearViewDayCell = ({ day, month, events }: IProps) => {
  const { push } = useRouter();
  const { setSelectedDate } = useCalendar();
  const [currentEvents, setCurrentEvents] = useState<IEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const maxIndicators = 3;

  const date = new Date(month.getFullYear(), month.getMonth(), day);

  useEffect(() => {
    async function lazyLoad() {
      setCurrentEvents(events.filter((event) => isSameDay(event.startDate, date)));
      setIsLoading(false);
    }

    lazyLoad();
  }, []);

  const handleClick = () => {
    setSelectedDate(date);
    push("day-view");
  };

  if (isLoading) {
    return (
      <Skeleton
        key={`day-${day}`}
        className="flex h-11 flex-1 flex-col items-center justify-start gap-0.5 rounded-md pt-1 hover:bg-accent focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
      />
    );
  }

  return (
    <button
      onClick={handleClick}
      type="button"
      className="flex h-11 flex-1 flex-col items-center justify-start gap-0.5 rounded-md pt-1 hover:bg-accent focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
    >
      <div
        className={cn(
          "flex size-6 items-center justify-center rounded-full text-xs font-medium",
          date ? isToday(date) && "bg-primary font-semibold text-primary-foreground" : ""
        )}
      >
        {day}
      </div>
      {
        <div className="mt-0.5 flex gap-0.5">
          {currentEvents.length <= maxIndicators ? (
            currentEvents.map((event) => <IconDot key={event.eventId} color={event.room.color as TColors}></IconDot>)
          ) : (
            <>
              <IconDot key={currentEvents[0].eventId} color={currentEvents[0].room.color as TColors}></IconDot>
              <span className="text-[7px] text-muted-foreground">+{currentEvents.length - 1}</span>
            </>
          )}
        </div>
      }
    </button>
  );
};

export default YearViewDayCell;
