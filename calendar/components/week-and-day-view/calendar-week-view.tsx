"use client";

import { startOfWeek, addDays, format, parseISO, isSameDay, areIntervalsOverlapping, endOfWeek } from "date-fns";

import { useCalendar } from "@/calendar/contexts/calendar-context";

import { ScrollArea } from "@/components/ui/scroll-area";

import { AddEventDialog } from "@/calendar/components/dialogs/add-event-dialog";
//import { EventBlock } from "@/calendar/components/week-and-day-view/event-block";
import { CalendarTimeline } from "@/calendar/components/week-and-day-view/calendar-time-line";
import { WeekViewMultiDayEventsRow } from "@/calendar/components/week-and-day-view/week-view-multi-day-events-row";

import { cn } from "@/lib/utils";
import {
  groupEvents,
  getEventBlockStyle,
  isWorkingHour,
  getVisibleHours,
  splitMultiDayEvents,
  getOverlappingMultiDayEvents,
} from "@/calendar/helpers";

import type { IEvent } from "@/calendar/interfaces";
import { DayHourlyEventDialogs } from "../day-hourly-event-dialogs";
import { HourColumn } from "../column-hourly";
import { ColumnDayHeader } from "../column-day-header";
import { EventBlock } from "../event-block";
import { useEffect, useState } from "react";
import { getEvents } from "@/services/events";
import { CalendarHeaderSkeleton } from "../header/calendar-header-skeleton";
import { CalendarHeader } from "../header/calendar-header";
import { CalendarWeekViewSkeleton } from "./calendar-week-view-skeleton";

interface IProps {
  events: IEvent[];
}

export function CalendarWeekView() {
  const { selectedDate, workingHours, visibleHours } = useCalendar();
  const [events, setEvents] = useState<IEvent[]>([]);

  const [isLoading, setLoading] = useState(true);

  const fetchEvents = async () => {
    setLoading(true);

    const StartOfWeek = startOfWeek(selectedDate);
    const EndOfWeek = endOfWeek(selectedDate);

    const eventList = await getEvents(StartOfWeek, EndOfWeek);

    setEvents(eventList);
    setLoading(false);
  };

  useEffect(() => {
    fetchEvents();
  }, [selectedDate]);

  const { hours, earliestEventHour, latestEventHour } = getVisibleHours(visibleHours, events);
  //console.log(events);
  //const test = splitMultiDayEvents(getOverlappingMultiDayEvents(singleDayEvents, selectedDate), visibleHours);
  //const test = splitMultiDayEvents(multiDayEvents, visibleHours);

  //singleDayEvents = [...singleDayEvents, ...test];

  const weekStart = startOfWeek(selectedDate);
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  return (
    <>
      {isLoading ? <CalendarHeaderSkeleton view={"week"} /> : <CalendarHeader view={"week"} events={events} />}
      <div className="flex flex-col items-center justify-center border-b py-4 text-sm text-muted-foreground sm:hidden">
        <p>Weekly view is not available on smaller devices.</p>
        <p>Please switch to daily or monthly view.</p>
      </div>

      <div className="hidden flex-col sm:flex">
        <div className="flex">
          <div className="flex flex-1 flex-col">
            <div>
              <ColumnDayHeader weekDays={weekDays} />
            </div>
            {isLoading ? (
              <CalendarWeekViewSkeleton />
            ) : (
              <ScrollArea className="max-h-[50vh] md:max-h-[60vh] lg:max-h-[70vh] xl:max-h-[73vh]" type="always">
                <div className="flex overflow-hidden">
                  {/* Hours column */}
                  <HourColumn hours={hours} />

                  {/* Week grid */}
                  <div className="relative flex-1 border-l">
                    <div className="grid grid-cols-7 divide-x">
                      {weekDays.map((day, dayIndex) => {
                        const dayEvents = events.filter(
                          (event) => isSameDay(event.startDate, day) //|| isSameDay(parseISO(event.endDate), day)
                        );

                        const test = dayEvents.filter((event) => event.eventId === event.parentEvent?.eventId);

                        const groupedEvents = groupEvents(dayEvents);

                        return (
                          <div key={dayIndex} className="relative">
                            <DayHourlyEventDialogs hours={hours} day={day} workingHours={workingHours} />

                            {groupedEvents.map((group, groupIndex) =>
                              group.map((event) => {
                                let style = getEventBlockStyle(event, day, groupIndex, groupedEvents.length, {
                                  from: earliestEventHour,
                                  to: latestEventHour,
                                });
                                const hasOverlap = groupedEvents.some(
                                  (otherGroup, otherIndex) =>
                                    otherIndex !== groupIndex &&
                                    otherGroup.some((otherEvent) =>
                                      areIntervalsOverlapping(
                                        {
                                          start: event.startDate,
                                          end: event.endDate,
                                        },
                                        {
                                          start: otherEvent.startDate,
                                          end: otherEvent.endDate,
                                        }
                                      )
                                    )
                                );

                                if (!hasOverlap) style = { ...style, width: "100%", left: "0%" };

                                return (
                                  <div key={event.eventId} className="absolute p-1" style={style}>
                                    <EventBlock event={event} pixelSize={96} />
                                  </div>
                                );
                              })
                            )}
                          </div>
                        );
                      })}
                    </div>

                    <CalendarTimeline />
                  </div>
                </div>
              </ScrollArea>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
