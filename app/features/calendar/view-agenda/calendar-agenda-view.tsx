"use client";
import { format } from "date-fns";
import { useReactToPrint } from "react-to-print";

import { AgendaEventCard } from "@/app/features/calendar/view-agenda/calendar-agenda-event-block";

import { usePrivateCalendar } from "@/contexts/CalendarProviderPrivate";
import { useEffect, useMemo, useRef, useState } from "react";

import { LoaderCircle, LucideCalendarDays, LucideDoorOpen, LucidePartyPopper, Printer } from "lucide-react";
import { AgendaEventSkeleton } from "./skeleton-calendar-agenda-event";
import { ScrollArea } from "@/components/ui/scroll-area";

import { CalendarDayColumnCalendar } from "@/app/features/calendar/sidebar-day-picker/calendar-day-column-calendar";
import { Button } from "@/components/ui/button";
import { usePrivateCalendarEvents } from "../webworkers/use-calendar-private-events";
import { cn } from "@/lib/utils";
import { GenericError } from "../../../../components/shared/generic-error";
import { Label } from "@/components/ui/label";
import { TStatusKey } from "@/lib/types";
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";

export function CalendarAgendaView({ date, userId }: { date: Date; userId?: string }) {
  const {
    visibleHours,
    visibleRooms,
    selectedRoomIds,
    selectedStatusKeys,
    setIsHeaderLoading,
    setTotalEvents,
    configurationError,
    roomError,
  } = usePrivateCalendar();

  const roomIds = useMemo(
    () => (visibleRooms ? visibleRooms.map((room) => room.roomId.toString()) : []),
    [visibleRooms],
  );

  const { result, isLoading, error } = usePrivateCalendarEvents(
    "AGENDA",
    date,
    visibleHours,
    userId,
    roomIds,
    selectedStatusKeys,
  );

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
      (room) => selectedRoomIds.includes("-1") || selectedRoomIds.includes(String(room.roomId)),
    );
  }, [selectedRoomIds, result]);

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

  const emptyState =
    selectedRoomIds.length === 0
      ? { title: "No Room Selected", message: "Please choose a room", icon: <LucideDoorOpen /> }
      : eventsToRender.length === 0
        ? {
            title: "No Events Found",
            message: "There don't appear to be events associated with this date",
            icon: <LucidePartyPopper />,
          }
        : null;

  if (error) {
    return <GenericError error={error} />;
  }

  return (
    <>
      <div className="flex flex-1 min-h-0">
        {isMounting ? (
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

                <div className="space-y-2 m-4">
                  {emptyState ? (
                    <EmptyMessage title={emptyState.title} message={emptyState.message} icon={emptyState.icon} />
                  ) : isLoading ? (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <div className="flex flex-col bg-accent-foreground text-accent px-4 py-2 rounded ">
                        <LoaderCircle className="animate-spin" />
                      </div>
                    </div>
                  ) : (
                    eventsToRender?.map((event) => {
                      return (
                        <div
                          key={`break-${format(event.startDate, "yyyy-MM-dd-HH-mm")}-event-${event.eventId}-room-${event.roomId}`}
                          className="break-inside-avoid"
                        >
                          <AgendaEventCard
                            key={`agenda-${format(event.startDate, "yyyy-MM-dd-HH-mm")}-event-${event.eventId}-room-${event.roomId}`}
                            event={event}
                            userId={userId}
                          />
                        </div>
                      );
                    })
                  )}
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

function EmptyMessage({ title, message, icon }: { title: string; message: string; icon: React.ReactNode }) {
  return (
    <div className="absolute inset-0 flex flex-col pointer-events-none pt-14">
      <div className="flex flex-1 flex-col  p-4">
        <Empty className="border border-dashed flex flex-1 flex-col items-center justify-center">
          <EmptyHeader>
            <EmptyMedia>{icon}</EmptyMedia>
            <EmptyTitle>{title}</EmptyTitle>
            <EmptyDescription>{message}</EmptyDescription>
          </EmptyHeader>
        </Empty>
      </div>
    </div>
  );
}
