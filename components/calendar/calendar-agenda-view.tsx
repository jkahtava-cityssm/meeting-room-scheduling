"use client";
import { endOfDay, format, startOfDay } from "date-fns";
import { useReactToPrint } from "react-to-print";

import { AgendaEventCard } from "@/components/calendar/calendar-agenda-event-block";

import { useCalendar } from "@/contexts/CalendarProvider";
import { useEffect, useMemo, useRef, useState } from "react";
import { useAllDailyEvents } from "@/services/events";
import { CalendarHeader } from "./calendar-all-header";
import { Label } from "@radix-ui/react-dropdown-menu";
import { Clock, Calendar, User, Printer } from "lucide-react";
import { AgendaEventSkeleton } from "./skeleton-calendar-agenda-event";
import { ScrollArea } from "@/components/ui/scroll-area";
import { SingleCalendar } from "@/components/ui/single-calendar";
import { filterEventsByRoom } from "../../lib/helpers";
import { Button } from "../ui/button";
import useSWR from "swr";
import { IEvent } from "@/lib/schemas/schemas";

export interface AgendaProcessData {
  events: IEvent[];
  selectedDate: Date;
  selectedRoomId: string;
  multiDayEventsAtTop: boolean;
}

export interface AgendaResponseData {
  totalEvents: number;
  sortedEvents: IEvent[];
}

export function CalendarAgendaView({ date }: { date: Date }) {
  const [isLoading, setLoading] = useState(true);
  const [isRefreshed, setRefreshed] = useState(false);
  const [filteredEvents, setFilteredEvents] = useState<IEvent[]>([]);

  const { visibleHours, selectedRoomId, setIsHeaderLoading, setTotalEvents } = useCalendar();

  const workerRef = useRef<Worker | null>(null);

  const startDate: Date = startOfDay(date);
  const endDate: Date = endOfDay(date);
  const { data: events } = useSWR<IEvent[]>(
    `/api/calendar?startdate=${startDate.toISOString()}&enddate=${endDate.toISOString()}`
  );

  useEffect(() => {
    //The Workerthread needs to be recreated when we navigate back to the page if the params havent changed.
    //nextjs cache's the route so this is my temporary fix
    setRefreshed(true);
  }, []);

  useEffect(() => {
    //This is mostly as an example for myself, technically this processing should likely be done on the server side.
    //But this example will come in handy for other applications

    if (workerRef.current) {
      return;
    }

    const newWorker = new Worker(new URL("./calendar-agenda-webworker.ts", import.meta.url));

    newWorker.onmessage = (event: MessageEvent<AgendaResponseData>) => {
      setFilteredEvents(event.data.sortedEvents);
      setTotalEvents(event.data.totalEvents);
      setIsHeaderLoading(false);
      setLoading(false);
    };

    workerRef.current = newWorker;

    return () => {
      if (workerRef.current) {
        workerRef.current.terminate();
        workerRef.current = null;
      }
    };
  }, [date, setIsHeaderLoading, setTotalEvents]);

  useEffect(() => {
    if (!events) {
      return;
    }

    if (workerRef.current) {
      const data: AgendaProcessData = {
        events: events,
        selectedDate: date,
        selectedRoomId: selectedRoomId,
        multiDayEventsAtTop: true,
      };
      setLoading(true);
      setIsHeaderLoading(true);

      workerRef.current.postMessage(data);
    }
  }, [events, date, selectedRoomId, isRefreshed, setIsHeaderLoading, visibleHours]);

  const printContentRef = useRef<HTMLDivElement>(null);
  const reactPrintFunction = useReactToPrint({
    contentRef: printContentRef,
    documentTitle: `Agenda: ${format(date, "EEEE, MMMM d, yyyy")}`,
    pageStyle: "@page { size: auto;  margin: 0mm; } @media print { body { -webkit-print-color-adjust: exact; } }",
  });

  return (
    <>
      {isLoading ? (
        <AgendaEventSkeleton selectedDate={date}></AgendaEventSkeleton>
      ) : (
        <div className="flex">
          <div className="flex flex-1 flex-col space-y-2">
            <ScrollArea className="max-h-[50vh] md:max-h-[60vh] lg:max-h-[70vh] xl:max-h-[73vh]" type="always">
              <div ref={printContentRef}>
                <div className="sticky top-0 flex items-center gap-4 bg-accent p-2">
                  <Label className="flex-1 text-md font-semibold">{format(date, "EEEE, MMMM d, yyyy")}</Label>
                  <Button className="no-print mr-2" onClick={reactPrintFunction}>
                    <Printer /> Print Agenda
                  </Button>
                </div>

                <div className="space-y-2 m-2">
                  {filteredEvents.length > 0 &&
                    filteredEvents.map((event, index) => (
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
              selected={date}
              onSelect={() => {}}
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
