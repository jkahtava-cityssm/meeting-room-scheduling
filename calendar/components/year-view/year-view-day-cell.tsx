import { isToday } from "date-fns";
import { useRouter } from "next/navigation";

import { useCalendar } from "@/calendar/contexts/calendar-context";

import { cn } from "@/lib/utils";

import type { IEvent } from "@/calendar/interfaces";
import { IconColored } from "@/components/ui/icon-colored";
import { Dot, DotIcon } from "lucide-react";
import { IconDot } from "@/components/ui/icon-dot";

interface IProps {
  day: number;
  date: Date;
  events: IEvent[];
}

export function YearViewDayCell({ day, date, events }: IProps) {
  const { push } = useRouter();
  const { setSelectedDate } = useCalendar();

  const maxIndicators = 3;
  const eventCount = events.length;

  const handleClick = () => {
    setSelectedDate(date);
    push("day-view");
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
          isToday(date) && "bg-primary font-semibold text-primary-foreground"
        )}
      >
        {day}
      </div>

      {eventCount > 0 && (
        <div className="mt-0.5 flex gap-0.5">
          {eventCount <= maxIndicators ? (
            events.map((event) => (
              //<div key={event.id} color={event.room.color} className={cn("size-1.5 rounded-full bg-primary")} />
              <IconDot key={event.eventId} color={event.room.color}></IconDot>
            ))
          ) : (
            <>
              <IconDot key={events[0].eventId} color={events[0].room.color}></IconDot>
              <span className="text-[7px] text-muted-foreground">+{eventCount - 1}</span>
            </>
          )}
        </div>
      )}
    </button>
  );
}
