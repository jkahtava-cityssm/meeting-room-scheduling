"use client";

import { Calendar, Clock, User } from "lucide-react";
import { parseISO, areIntervalsOverlapping, format, startOfDay, endOfDay } from "date-fns";

import { useCalendar } from "@/calendar/contexts/calendar-context";

import { ScrollArea } from "@/components/ui/scroll-area";
import { SingleCalendar } from "@/components/ui/single-calendar";

import { AddEventDialog } from "@/calendar/components/dialogs/add-event-dialog";
//import { EventBlock } from "@/calendar/components/week-and-day-view/event-block";

import { CalendarTimeline } from "@/calendar/components/week-and-day-view/calendar-time-line";
import { DayViewMultiDayEventsRow } from "@/calendar/components/week-and-day-view/day-view-multi-day-events-row";

import { cn } from "@/lib/utils";
import {
  groupEvents,
  getEventBlockStyle,
  isWorkingHour,
  getCurrentEvents,
  getVisibleHours,
  splitMultiDayEvents,
  getOverlappingMultiDayEvents,
  hasOverlap,
} from "@/calendar/helpers";

import type { IEvent } from "@/calendar/interfaces";
import { DayHourlyEventDialogs } from "../day-hourly-event-dialogs";
import { HourColumn } from "../column-hourly";
import { ColumnDayHeader } from "../column-day-header";
import { EventBlock } from "../event-block";
import React, { useEffect, useMemo, useState } from "react";
import { getEventsDaily } from "@/services/events";
import { CalendarHeader } from "../header/calendar-header";
import { CalendarHeaderSkeleton } from "../header/calendar-header-skeleton";
import { CalendarDayViewSkeleton } from "./calendar-day-view-skeleton";

interface IProps {
  singleDayEvents: IEvent[];
  multiDayEvents: IEvent[];
}

export function CalendarDayView() {
  const { selectedDate, setSelectedDate, selectedRoomId, visibleHours, workingHours } = useCalendar();

  const [currentMonth, setCurrentMonth] = React.useState<Date>(selectedDate);

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

    /*setTimeout(() => {
      fetchEvents();
    },4000);*/
  }, [selectedDate]);

  const handleToday = () => {
    setCurrentMonth(new Date());
    setSelectedDate(new Date());
  };

  const filteredEvents = useMemo(
    () =>
      events.filter((event) => {
        return event.roomId.toString() === selectedRoomId || selectedRoomId === "-1";
      }),
    [events, selectedRoomId]
  );

  const splitEvents = useMemo(
    () => splitMultiDayEvents(filteredEvents, startOfDay(selectedDate), endOfDay(selectedDate), visibleHours),
    [events, visibleHours]
  );

  const { hours, earliestEventHour, latestEventHour } = getVisibleHours(visibleHours, splitEvents);

  //const currentEvents = getCurrentEvents(events);

  /*const dayEvents = events.filter((event) => {
    const eventDate = event.startDate;
    return (
      eventDate.getDate() === selectedDate.getDate() &&
      eventDate.getMonth() === selectedDate.getMonth() &&
      eventDate.getFullYear() === selectedDate.getFullYear()
    );
  });*/

  const groupedEvents = groupEvents(splitEvents);

  return (
    <>
      <CalendarHeader view={"day"} />
      {
        //isLoading ? <CalendarHeaderSkeleton view={"day"} /> : <CalendarHeader view={"day"} />
      }
      {isLoading ? (
        <CalendarDayViewSkeleton />
      ) : (
        <div className="flex">
          <div className="flex flex-1 flex-col">
            <ColumnDayHeader weekDays={[selectedDate]} />

            <ScrollArea className="max-h-[50vh] md:max-h-[60vh] lg:max-h-[70vh] xl:max-h-[73vh]" type="always">
              <div className="flex border-l">
                {/* Hours column   h-[500px]  */}
                <HourColumn hours={hours} />

                {/* Day grid */}
                <div className="relative flex-1 border-b">
                  <div className="relative">
                    <DayHourlyEventDialogs hours={hours} day={selectedDate} workingHours={workingHours} />

                    {groupedEvents.map((group, groupIndex) =>
                      group.map((event) => {
                        let style = getEventBlockStyle(event, selectedDate, groupIndex, groupedEvents.length, {
                          from: earliestEventHour,
                          to: latestEventHour,
                        });

                        if (!hasOverlap(groupedEvents, event, groupIndex))
                          style = { ...style, width: "100%", left: "0%" };

                        return (
                          <div key={event.eventId} className="absolute p-1" style={style}>
                            <EventBlock event={event} pixelSize={96} />
                          </div>
                        );
                      })
                    )}
                  </div>

                  <CalendarTimeline />
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
              month={currentMonth}
              onMonthChange={setCurrentMonth}
              required
              onToday={handleToday}
            />

            <div className="flex-1 space-y-3">
              {splitEvents.length > 0 ? (
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

              {splitEvents.length > 0 && (
                <div className="flex">
                  <div className="flex flex-1 flex-col">
                    <ScrollArea className="max-h-[25vh] md:max-h-[35vh] lg:max-h-[45vh] px-4" type="always">
                      {/* h-[422px] max-h-[25vh] md:max-h-[35vh] lg:max-h-[45vh] */}
                      <div className="space-y-6 pb-4">
                        {splitEvents.map((event, index) => {
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
