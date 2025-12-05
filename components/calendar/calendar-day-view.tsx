"use client";

import { startOfDay, endOfDay, format } from "date-fns";
import { useCalendar } from "@/contexts/CalendarProvider";
import { ScrollArea } from "@/components/ui/scroll-area";

import { CalendarTimeline } from "@/components/calendar/calendar-day-timeline";

import { DayHourlyEventDialogs } from "./calendar-day-event-block-add-hour-block";
import { HourColumn } from "./calendar-day-column-hourly";
import { DayViewDayHeader } from "./calendar-day-view-day-header";
import { EventBlock } from "./calendar-day-event-block";
import { useEffect, useRef, useState } from "react";

import { CalendarDayViewSkeleton } from "./skeleton-calendar-day-view";
import { IEvent } from "@/lib/schemas/calendar";
import { TVisibleHours, TWorkingHours } from "@/lib/types";

import { CalendarDayColumnCalendar } from "./calendar-day-column-calendar";
import { useEventsQuery } from "@/lib/services/events";
import { Alert, AlertDescription, AlertTitle } from "../ui/alert";
import { Terminal } from "lucide-react";
import { Button } from "../ui/button";

export interface IDayProcessData {
  events: IEvent[];
  selectedDate: Date;
  selectedRoomId: string;
  pixelHeight: number;
  visibleHours: TVisibleHours;
  multiDayEventsAtTop: boolean;
}

export interface IDayResponseData {
  totalEvents: number;
  dayViews: IDayView[];
  hours: number[];
  filteredEvents: IEvent[];
  roomIds: string[];
}

export interface IDayView {
  day: number;
  dayDate: Date;
  isToday: boolean;
  eventBlocks: IEventBlock[];
}

export interface IEventBlock {
  groupIndex: number;
  eventIndex: number;
  eventStyle: { top: string; width: string; left: string };
  eventHeight: number;
  event: IEvent;
  roomId: number;
}

export function CalendarDayView({ date, userId }: { date: Date; userId?: string }) {
  const [isLoading, setLoading] = useState(true);
  const [isRefreshed, setRefreshed] = useState(false);
  const [dayViews, setDayViews] = useState<IDayView | undefined>(undefined);
  const [filteredEvents, setFilteredEvents] = useState<IEvent[]>([]);
  const [hours, setHours] = useState<number[]>([]);
  const [rooms, setRooms] = useState<string[]>([]);

  const { workingHours, visibleHours, selectedRoomId, setIsHeaderLoading, setTotalEvents } = useCalendar();

  const workerRef = useRef<Worker | null>(null);

  const startDate: Date = startOfDay(date);
  const endDate: Date = endOfDay(date);

  const { data: events, error } = useEventsQuery(startDate, endDate, userId);

  useEffect(() => {
    if (error) {
      console.log(error);
      setLoading(false);
    }
  }, [error]);

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

    const newWorker = new Worker(new URL("./webworkers/calendar-day-webworker.ts", import.meta.url));

    newWorker.onmessage = (event: MessageEvent<IDayResponseData>) => {
      setDayViews(event.data.dayViews[0]);
      setHours(event.data.hours);
      setTotalEvents(event.data.totalEvents);
      setFilteredEvents(event.data.filteredEvents);
      setRooms(event.data.roomIds);
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
      const data: IDayProcessData = {
        events: events,
        visibleHours: visibleHours,
        selectedDate: date,
        selectedRoomId: selectedRoomId,
        multiDayEventsAtTop: true,
        pixelHeight: 96,
      };
      //setLoading(true);
      setIsHeaderLoading(true);

      workerRef.current.postMessage(data);
    }
  }, [events, date, selectedRoomId, isRefreshed, setIsHeaderLoading, visibleHours]);

  if (isLoading) {
    return (
      <div className="flex">
        <CalendarDayViewSkeleton />
        <CalendarDayColumnCalendar
          date={date}
          isLoading={isLoading}
          events={filteredEvents}
          view={"day"}
        ></CalendarDayColumnCalendar>
      </div>
    );
  }

  if (!dayViews || error) {
    return (
      <div className="flex">
        <div className="flex flex-1 flex-col">
          <Button variant={"link"} size={"sm"}>
            <span className="py-2 text-center text-xs font-medium text-muted-foreground">
              ERROR <span className="ml-1 font-semibold text-foreground">Error</span>
            </span>
          </Button>
          <div className="flex h-full border-l">
            <div className="w-18 border-r"></div>
            <div className="relative flex-1 border-b p-4">
              <Alert variant="destructive" className="mt-4 ">
                <Terminal className="h-4 w-4" />
                <AlertTitle>An error has occurred</AlertTitle>
                <AlertDescription>You do not have permission to view these events.</AlertDescription>
              </Alert>
            </div>
          </div>
        </div>
        <CalendarDayColumnCalendar
          date={date}
          isLoading={isLoading}
          events={filteredEvents}
          view={"day"}
        ></CalendarDayColumnCalendar>
      </div>
    );
  }

  return (
    <>
      <div className="flex">
        <div className="flex flex-1 flex-col">
          <DayViewDayHeader key={dayViews.day} dayView={dayViews} />

          <ScrollArea className="max-h-[50vh] md:max-h-[60vh] lg:max-h-[70vh] xl:max-h-[73vh]" type="always">
            <div className="flex border-l">
              {/* Hours column   h-[500px]  */}
              <HourColumn hours={hours} />

              {/* Day grid */}
              <div className="relative flex-1 border-b">
                <div className="relative">
                  <DayRoomsGrid
                    rooms={rooms}
                    dayViews={dayViews}
                    hours={hours}
                    workingHours={workingHours}
                    userId={userId}
                  ></DayRoomsGrid>
                </div>

                <CalendarTimeline />
              </div>
            </div>
          </ScrollArea>
        </div>
        <CalendarDayColumnCalendar
          date={date}
          isLoading={isLoading}
          events={filteredEvents}
          view={"day"}
        ></CalendarDayColumnCalendar>
      </div>
    </>
  );
}

function DayRoomsGrid({
  rooms,
  dayViews, // your day view object
  hours,
  workingHours,
  userId,
}: {
  rooms: string[];
  dayViews: IDayView;
  hours: number[];
  workingHours: TWorkingHours;
  userId: string | undefined;
}) {
  return (
    <div className="flex w-full">
      {rooms?.map((room) => {
        const roomBlocks = dayViews.eventBlocks.filter((b) => String(b.roomId) === room);

        return (
          <div key={room} className="relative flex-1 border-b">
            {/* Optional room header 
                        <div className="sticky top-0 z-10 bg-white border-b px-2 py-1 text-sm font-medium">{room.name}</div>
            */}

            <div className="relative">
              <DayHourlyEventDialogs hours={hours} day={dayViews.dayDate} workingHours={workingHours} userId={userId} />

              {roomBlocks.map((block) => (
                <div
                  key={`day-${dayViews.day}-room-${room}-block-${format(
                    block.event.startDate,
                    "yyyy-MM-dd-HH-mm"
                  )}-event-${block.event.eventId}`}
                  className="absolute p-1"
                  style={block.eventStyle} // top/left/width are within this room column
                >
                  <EventBlock eventBlock={block} heightInPixels={block.eventHeight} userId={userId} />
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
