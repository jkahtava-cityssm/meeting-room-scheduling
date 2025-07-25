"use client";
import { endOfDay, format, startOfDay } from "date-fns";
import { useReactToPrint } from "react-to-print";

import { AgendaEventCard } from "@/components/calendar/calendar-agenda-event-block";

import { useCalendar } from "@/contexts/CalendarProvider";
import { useEffect, useRef, useState } from "react";
import { Label } from "@radix-ui/react-dropdown-menu";
import { Printer } from "lucide-react";
import { AgendaEventSkeleton } from "./skeleton-calendar-agenda-event";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "../ui/button";
import { IEvent } from "@/lib/schemas/calendar";
import { CalendarDayColumnCalendar } from "./calendar-day-column-calendar";
import { useEventsQuery } from "@/services/events";

export interface IAgendaProcessData {
  events: IEvent[];
  selectedDate: Date;
  selectedRoomId: string;
  multiDayEventsAtTop: boolean;
}

export interface IAgendaResponseData {
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
  //const { data: events } = useSWR<IEvent[]>();

  const { isPending, error, data: events, isFetching } = useEventsQuery(startDate, endDate);

  useEffect(() => {
    //The Workerthread needs to be recreated when we navigate back to the page if the params havent changed.
    //nextjs cache's the route so this is my temporary fix
    setRefreshed(true);
  }, []);

  useEffect(() => {
    setLoading(true);
  }, [date]);

  useEffect(() => {
    //This is mostly as an example for myself, technically this processing should likely be done on the server side.
    //But this example will come in handy for other applications

    if (workerRef.current) {
      return;
    }

    const newWorker = new Worker(new URL("./calendar-agenda-webworker.ts", import.meta.url));

    newWorker.onmessage = (event: MessageEvent<IAgendaResponseData>) => {
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
      const data: IAgendaProcessData = {
        events: events,
        selectedDate: date,
        selectedRoomId: selectedRoomId,
        multiDayEventsAtTop: true,
      };
      //setLoading(true);
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
      <div className="flex">
        {isLoading ? (
          <AgendaEventSkeleton selectedDate={date}></AgendaEventSkeleton>
        ) : (
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
                    filteredEvents.map((event) => (
                      <div
                        key={`break-${format(event.startDate, "yyyy-MM-dd-HH-mm")}-event-${event.eventId}`}
                        className="break-inside-avoid"
                      >
                        <AgendaEventCard
                          key={`agenda-${format(event.startDate, "yyyy-MM-dd-HH-mm")}-event-${event.eventId}`}
                          event={event}
                        />
                      </div>
                    ))}
                </div>
              </div>
            </ScrollArea>
          </div>
        )}
        <CalendarDayColumnCalendar
          date={date}
          isLoading={isLoading}
          events={filteredEvents}
          view={"agenda"}
        ></CalendarDayColumnCalendar>
      </div>
    </>
  );
}
