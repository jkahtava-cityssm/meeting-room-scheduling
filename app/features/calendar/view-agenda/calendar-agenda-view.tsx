"use client";
import { format } from "date-fns";
import { useReactToPrint } from "react-to-print";

import { AgendaEventCard } from "@/app/features/calendar/view-agenda/calendar-agenda-event-block";

import { usePrivateCalendar } from "@/contexts/CalendarProviderPrivate";
import { useEffect, useMemo, useRef, useState } from "react";
import { Label } from "@radix-ui/react-dropdown-menu";
import { Printer } from "lucide-react";
import { AgendaEventSkeleton } from "./skeleton-calendar-agenda-event";
import { ScrollArea } from "@/components/ui/scroll-area";

import { CalendarDayColumnCalendar } from "@/app/features/calendar/sidebar-day-picker/calendar-day-column-calendar";
import { Button } from "@/components/ui/button";
import { usePrivateCalendarEvents } from "../webworkers/use-calendar-private-events";
import { cn } from "@/lib/utils";

export function CalendarAgendaView({ date, userId }: { date: Date; userId?: string }) {
  const { interval, visibleHours, defaultHours, visibleRooms, selectedRoomId, setIsHeaderLoading, setTotalEvents } =
    usePrivateCalendar();

  const roomIds = useMemo(
    () => (visibleRooms ? visibleRooms.map((room) => room.roomId.toString()) : []),
    [visibleRooms],
  );

  const { result, isLoading } = usePrivateCalendarEvents("AGENDA", date, visibleHours, userId, roomIds);

  useEffect(() => {
    if (isLoading) {
      setIsHeaderLoading(true);
    }

    if (result && !isLoading) {
      setIsHeaderLoading(false);
    }
  }, [isLoading, result, setIsHeaderLoading, setTotalEvents]);

  const eventsToRender = useMemo(() => {
    if (!result) return [];

    return result?.data.sortedEvents.filter(
      (room) => selectedRoomId === "-1" || String(room.roomId) === selectedRoomId,
    );
  }, [selectedRoomId, result]);

  useEffect(() => {
    setTotalEvents(eventsToRender.length);
  }, [eventsToRender, setTotalEvents]);

  const isMounting = !visibleRooms || !result;

  const printContentRef = useRef<HTMLDivElement>(null);
  const reactPrintFunction = useReactToPrint({
    contentRef: printContentRef,
    documentTitle: `Agenda: ${format(date, "EEEE, MMMM d, yyyy")}`,
    pageStyle: "@page { size: auto;  margin: 0mm; } @media print { body { -webkit-print-color-adjust: exact; } }",
  });

  return (
    <>
      <div className="flex flex-1 min-h-0">
        {isLoading ? (
          <AgendaEventSkeleton selectedDate={date}></AgendaEventSkeleton>
        ) : (
          <div className={cn("flex flex-col min-h-0  min-w-0 transition-[width] duration-600 ease-in-out flex-1")}>
            <ScrollArea className="w-full flex-1 min-h-0" type="always">
              <div ref={printContentRef}>
                <div className="sticky top-0 flex items-center gap-4 bg-accent p-2">
                  <Label className="flex-1 text-md font-semibold">{format(date, "EEEE, MMMM d, yyyy")}</Label>
                  <Button className="no-print mr-2" onClick={reactPrintFunction}>
                    <Printer /> Print Agenda
                  </Button>
                </div>

                <div className="space-y-2 m-2">
                  {eventsToRender.length > 0 &&
                    eventsToRender.map((event) => {
                      return (
                        <div
                          key={`break-${format(event.startDate, "yyyy-MM-dd-HH-mm")}-event-${event.eventId}`}
                          className="break-inside-avoid"
                        >
                          <AgendaEventCard
                            key={`agenda-${format(event.startDate, "yyyy-MM-dd-HH-mm")}-event-${event.eventId}`}
                            event={event}
                            userId={userId}
                          />
                        </div>
                      );
                    })}
                </div>
              </div>
            </ScrollArea>
          </div>
        )}
        <CalendarDayColumnCalendar
          date={date}
          isLoading={isLoading}
          events={eventsToRender}
          view={"agenda"}
        ></CalendarDayColumnCalendar>
      </div>
    </>
  );
}
