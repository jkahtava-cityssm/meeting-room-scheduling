"use client";
import { differenceInDays, endOfDay, format, parseISO, startOfDay } from "date-fns";

import { AgendaEventCard } from "@/calendar/components/agenda-view/agenda-event-card";

import type { IEvent } from "@/calendar/interfaces";
import { useCalendar } from "@/calendar/contexts/calendar-context";
import { useEffect, useMemo, useState } from "react";
import { getEventsDaily } from "@/services/events";
import { CalendarHeaderSkeleton } from "../header/calendar-header-skeleton";
import { CalendarHeader } from "../header/calendar-header";
import { Label } from "@radix-ui/react-dropdown-menu";
import { Clock, Text, Book, MapPin, Calendar, User } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { AgendaEventSkeleton } from "./agenda-event-skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { SingleCalendar } from "@/components/ui/single-calendar";

interface IProps {
  date: Date;
  events: IEvent[];
  multiDayEvents: IEvent[];
}

export function AgendaDayView() {
  const { selectedDate, selectedRoomId, setSelectedDate } = useCalendar();

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

  const filteredEvents = useMemo(
    () =>
      events.filter((event) => {
        return event.roomId.toString() === selectedRoomId || selectedRoomId === "-1";
      }),
    [events, selectedRoomId]
  );

  const sortedEvents = [...filteredEvents].sort(
    (a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
  );

  return (
    <>
      <CalendarHeader view={"agenda"} selectedDate={selectedDate} events={events} isLoading={isLoading} />
      {
        //isLoading ? <CalendarHeaderSkeleton view={"agenda"} /> : <CalendarHeader view={"agenda"} events={events} />
      }
      {isLoading ? (
        <>
          <AgendaEventSkeleton selectedDate={selectedDate}></AgendaEventSkeleton>
        </>
      ) : (
        <div className="flex">
          <div className="space-y-2">
            <div className="sticky top-14 flex items-center gap-4 bg-accent p-2">
              <Label className="text-md font-semibold">{format(selectedDate, "EEEE, MMMM d, yyyy")}</Label>
            </div>

            <div className="space-y-2 m-2">
              {sortedEvents.length > 0 &&
                sortedEvents.map((event) => <AgendaEventCard key={event.eventId} event={event} />)}
            </div>
          </div>
          <div className="hidden w-74 divide-y border-l md:block">
            <SingleCalendar
              className="mx-auto w-fit"
              mode="single"
              selected={selectedDate}
              onSelect={setSelectedDate}
              //month={currentMonth}
              //onMonthChange={setCurrentMonth}
              required
              //onToday={handleToday}
            />

            <div className="flex-1 space-y-3">
              {filteredEvents.length > 0 ? (
                <div className="flex items-start gap-2 px-4 pt-4">
                  <span className="relative mt-[5px] flex size-2.5">
                    <span className="absolute inline-flex size-full animate-ping rounded-full bg-green-400 opacity-75"></span>
                    <span className="relative inline-flex size-2.5 rounded-full bg-green-600"></span>
                  </span>

                  <p className="text-sm font-semibold text-foreground">Happening now</p>
                </div>
              ) : (
                <p className="p-4 text-center text-sm italic text-muted-foreground">
                  No appointments or consultations at the moment
                </p>
              )}

              {filteredEvents.length > 0 && (
                <div className="flex">
                  <div className="flex flex-1 flex-col">
                    <ScrollArea className="max-h-[25vh] md:max-h-[35vh] lg:max-h-[40vh] px-4" type="always">
                      {/* h-[422px] max-h-[25vh] md:max-h-[35vh] lg:max-h-[45vh] */}
                      <div className="space-y-6 pb-4">
                        {filteredEvents.map((event, index) => {
                          const room = false; // = currentEvents.room; //rooms.find((room) => room.id === event.room.id);

                          return (
                            <div key={event.eventId + "-" + index} className="space-y-1.5">
                              <p className="line-clamp-2 text-sm font-semibold">{event.title}</p>

                              {room && (
                                <div className="flex items-center gap-1.5 text-muted-foreground">
                                  <User className="size-3.5" />
                                  <span className="text-sm">{room}</span>
                                </div>
                              )}

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
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
