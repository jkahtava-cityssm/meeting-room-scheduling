"use client";
import { endOfDay, format, startOfDay } from "date-fns";
import { useReactToPrint } from "react-to-print";

import { AgendaEventCard } from "@/components/calendar/calendar-agenda-event-block";
import type { IEvent } from "@/components/calendar/lib/interfaces";
import { useCalendar } from "@/components/calendar/contexts/calendar-context";
import { useEffect, useMemo, useReducer, useRef, useState } from "react";
import { getEventsDaily, useAllDailyEvents } from "@/services/events";
import { CalendarHeader } from "./calendar-all-header";
import { Label } from "@radix-ui/react-dropdown-menu";
import { Clock, Calendar, User, Printer } from "lucide-react";
import { AgendaEventSkeleton } from "./skeleton-calendar-agenda-event";
import { ScrollArea } from "@/components/ui/scroll-area";
import { SingleCalendar } from "@/components/ui/single-calendar";
import { filterEventsByRoom, splitMultiDayEvents } from "./lib/helpers";
import { Button } from "../ui/button";

export function AgendaDayView() {
  const { selectedDate, selectedRoomId, setSelectedDate, visibleHours } = useCalendar();
  /*const [events, setEvents] = useState<IEvent[]>([]);
  const [isLoading, setLoading] = useState(true);

  const fetchEvents = async () => {
    setLoading(true);

    const eventList = await getEventsDaily(selectedDate);

    if (eventList.error) {
      setEvents([]);
      setLoading(false);
      return;
    }

    const splitList = splitMultiDayEvents(
      eventList.data,
      startOfDay(selectedDate),
      endOfDay(selectedDate),
      visibleHours
    );

    setEvents(splitList);
    setLoading(false);
  };

  useEffect(() => {
    fetchEvents();
  }, [selectedDate]);

  */

  const { events, isLoading, isError } = useAllDailyEvents(selectedDate, visibleHours);

  const filteredEvents = useMemo(() => {
    if (events) {
      return filterEventsByRoom(events, selectedRoomId);
    }
    return [];
  }, [events, selectedRoomId]);

  const sortedEvents = [...filteredEvents].sort(
    (a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
  );

  const printContentRef = useRef<HTMLDivElement>(null);
  const reactPrintFunction = useReactToPrint({
    contentRef: printContentRef,
    documentTitle: `Agenda: ${format(selectedDate, "EEEE, MMMM d, yyyy")}`,
    pageStyle: "@page { size: auto;  margin: 0mm; } @media print { body { -webkit-print-color-adjust: exact; } }",
  });

  return (
    <>
      <CalendarHeader view={"agenda"} selectedDate={selectedDate} events={filteredEvents} isLoading={isLoading} />
      {isLoading ? (
        <AgendaEventSkeleton selectedDate={selectedDate}></AgendaEventSkeleton>
      ) : (
        <div className="flex">
          <div className="flex flex-1 flex-col space-y-2">
            <ScrollArea className="max-h-[50vh] md:max-h-[60vh] lg:max-h-[70vh] xl:max-h-[73vh]" type="always">
              <div ref={printContentRef}>
                <div className="sticky top-0 flex items-center gap-4 bg-accent p-2">
                  <Label className="flex-1 text-md font-semibold">{format(selectedDate, "EEEE, MMMM d, yyyy")}</Label>
                  <Button className="no-print mr-2" onClick={reactPrintFunction}>
                    <Printer /> Print Agenda
                  </Button>
                </div>

                <div className="space-y-2 m-2">
                  {sortedEvents.length > 0 &&
                    sortedEvents.map((event, index) => (
                      <div key={index} className="break-inside-avoid">
                        <AgendaEventCard key={event.eventId} event={event} fetchData={async () => {}} />
                      </div>
                    ))}
                </div>
              </div>
            </ScrollArea>
          </div>

          <div className="hidden w-74 divide-y border-l md:block">
            <SingleCalendar
              className="mx-auto w-fit"
              mode="single"
              selected={selectedDate}
              onSelect={setSelectedDate}
              month={new Date()}
              onMonthChange={() => {}}
              required
              onToday={() => {}}
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
