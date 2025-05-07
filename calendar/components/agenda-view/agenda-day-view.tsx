"use client";
import { differenceInDays, endOfDay, format, parseISO, startOfDay } from "date-fns";

import { AgendaEventCard } from "@/calendar/components/agenda-view/agenda-event-card";

import type { IEvent } from "@/calendar/interfaces";
import { useCalendar } from "@/calendar/contexts/calendar-context";
import { useEffect, useState } from "react";
import { getEventsDaily } from "@/services/events";
import { CalendarHeaderSkeleton } from "../header/calendar-header-skeleton";
import { CalendarHeader } from "../header/calendar-header";

interface IProps {
  date: Date;
  events: IEvent[];
  multiDayEvents: IEvent[];
}

export function AgendaDayView() {
  const { selectedDate } = useCalendar();

  const [events, setEvents] = useState<IEvent[]>([]);

  const [isLoading, setLoading] = useState(true);

  const fetchEvents = async () => {
    setLoading(true);

    const eventList = await getEventsDaily(selectedDate);

    setEvents(eventList.data);
    setLoading(false);
  };

  useEffect(() => {
    fetchEvents();
  }, [selectedDate]);

  const sortedEvents = [...events].sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());

  return (
    <>
      <CalendarHeader view={"agenda"} />
      {
        //isLoading ? <CalendarHeaderSkeleton view={"agenda"} /> : <CalendarHeader view={"agenda"} events={events} />
      }
      <div className="space-y-4">
        <div className="sticky top-0 flex items-center gap-4 bg-background py-2">
          <p className="text-sm font-semibold">{format(selectedDate, "EEEE, MMMM d, yyyy")}</p>
        </div>

        <div className="space-y-2">
          {/*multiDayEvents.length > 0 &&
          multiDayEvents.map((event) => {
            const eventStart = startOfDay(parseISO(event.startDate));
            const eventEnd = startOfDay(parseISO(event.endDate));
            const currentDate = startOfDay(date);

            const eventTotalDays = differenceInDays(eventEnd, eventStart) + 1;
            const eventCurrentDay =
              differenceInDays(currentDate, eventStart) + 1;
            return (
              <AgendaEventCard
                key={event.id}
                event={event}
                eventCurrentDay={eventCurrentDay}
                eventTotalDays={eventTotalDays}
              />
            );
          })*/}

          {sortedEvents.length > 0 &&
            sortedEvents.map((event) => <AgendaEventCard key={event.eventId} event={event} />)}
        </div>
      </div>
    </>
  );
}
