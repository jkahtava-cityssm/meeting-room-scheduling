import { format, isToday, isWithinInterval, set } from "date-fns";
import { useEffect, useState } from "react";

import { IEvent } from "@/lib/schemas/calendar";
import { Calendar, Clock, DoorClosed, User } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { BadgeColored } from "@/components/ui/badge-colored";
import { TColors, TStatusKey } from "@/lib/types";
import DynamicIcon, { IconName } from "@/components/ui/icon-dynamic";

function getDateAsOfNow(date: Date) {
  const now = new Date();
  const minutes = now.getMinutes();
  const hours = now.getHours();

  return set(date, { hours: hours, minutes: minutes });
}

function getCurrentEvents(events: IEvent[], date: Date) {
  const now = getDateAsOfNow(date);
  return (
    events.filter(
      (event) =>
        isWithinInterval(now, { start: event.startDate, end: event.endDate }) &&
        event.status.key === ("APPROVED" as TStatusKey),
    ) || null
  );
}

function getLastFiveMinuteInterval(date: Date) {
  const minutes = date.getMinutes();

  const remainder = minutes % 5;
  if (remainder !== 0) {
    date.setMinutes(minutes - remainder);
  }

  return date;
}

export function CalendarDayColumnCurrentEvents({ events, date }: { events: IEvent[]; date: Date }) {
  const [currentTime, setCurrentTime] = useState(getLastFiveMinuteInterval(getDateAsOfNow(date)));
  const [currentEvents, setCurrentEvents] = useState(
    getCurrentEvents(events, getLastFiveMinuteInterval(getDateAsOfNow(date))),
  );

  useEffect(() => {
    const timer = setInterval(() => {
      const now = getDateAsOfNow(date);
      const minutes = now.getMinutes();

      if (minutes % 5 === 0) {
        setCurrentTime(now);
        setCurrentEvents(getCurrentEvents(events, now));
      }
    }, 60 * 1000);
    return () => clearInterval(timer);
  }, [events, date]);

  return (
    <div className="flex flex-1 flex-col overflow-hidden space-y-3">
      <div className="shrink-0 flex items-start gap-2 px-4 pt-4">
        {isToday(date) ? (
          <span className="relative mt-[5px] flex size-2.5">
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-green-400 opacity-75"></span>
            <span className="relative inline-flex size-2.5 rounded-full bg-green-600"></span>
          </span>
        ) : (
          <span className="relative mt-[5px] flex size-2.5">
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex size-2.5 rounded-full bg-red-600"></span>
          </span>
        )}

        <p className="text-sm font-semibold text-foreground">
          {isToday(date) ? "Happening" : format(date, "MMMM do yyyy")} @ {format(currentTime, "h:mm a")}
        </p>
      </div>
      {currentEvents.length === 0 && (
        <div className="flex-1 px-4 pt-4">
          <p className="p-4 text-center text-sm italic text-muted-foreground">
            No events are scheduled for this time and day.
          </p>
        </div>
      )}

      {currentEvents.length > 0 && (
        <div className="flex flex-1 flex-col overflow-hidden">
          <ScrollArea className="h-0 min-h-full px-4" type="always">
            {/* h-[422px] max-h-[25vh] md:max-h-[35vh] lg:max-h-[45vh] */}
            <div className="space-y-6 pb-4">
              {currentEvents.map((event, index) => {
                const room = event.room.name; // = currentEvents.room; //rooms.find((room) => room.id === event.room.id);

                return (
                  <div key={event.eventId + "-" + index} className="space-y-1.5">
                    <p className="line-clamp-2 text-sm font-semibold">{event.title}</p>

                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <DynamicIcon
                        name={event.room.icon as IconName}
                        color={event.room.color as TColors}
                        className="size-3.5"
                      />
                      <BadgeColored color={event.room.color as TColors}>{event.room.name}</BadgeColored>
                    </div>

                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <Calendar className="size-3.5" />
                      <span className="text-sm">{format(new Date(), "MMM d, yyyy")}</span>
                    </div>

                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <Clock className="size-3.5" />
                      <span className="text-sm">
                        {format(event.startDate, "h:mm a")} - {format(event.endDate, "h:mm a")}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        </div>
      )}
    </div>
  );
}
