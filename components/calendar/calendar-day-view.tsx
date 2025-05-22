"use client";

import { Calendar, Clock, User } from "lucide-react";
import { format, startOfDay, endOfDay, addYears } from "date-fns";
import { useCalendar } from "@/components/calendar/contexts/calendar-context";
import { ScrollArea } from "@/components/ui/scroll-area";
import { SingleCalendar } from "@/components/ui/single-calendar";
import { CalendarTimeline } from "@/components/calendar/calendar-day-timeline";
import {
  groupEvents,
  getEventBlockStyle,
  getVisibleHours,
  splitMultiDayEvents,
  hasOverlap,
  filterEventsByRoom,
  getRecurringEvents,
} from "@/components/calendar/lib/helpers";
import type { IEvent } from "@/components/calendar/lib/interfaces";
import { DayHourlyEventDialogs } from "./calendar-day-event-block-add-hour-block";
import { HourColumn } from "./calendar-day-column-hourly";
import { ColumnDayHeader } from "./calendar-all-column-day-header";
import { EventBlock } from "./calendar-day-event-block";
import React, { useEffect, useMemo, useState } from "react";
import { getEventsDaily, useDailyEvents } from "@/services/events";
import { CalendarHeader } from "./calendar-all-header";
import { CalendarDayViewSkeleton } from "./skeleton-calendar-day-view";
import { getRecurrencesWeekly } from "@/services/recurrence";

export function CalendarDayView() {
  const { selectedDate, setSelectedDate, selectedRoomId, visibleHours, workingHours } = useCalendar();
  const [currentMonth, setCurrentMonth] = React.useState<Date>(selectedDate);
  //const [events, setEvents] = useState<IEvent[]>([]);
  //const [isLoading, setLoading] = useState(true);

  const { events, isLoading, isError } = useDailyEvents(selectedDate);

  /*const fetchEvents = async () => {
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

    const recurrenceList = await getRecurrencesWeekly(selectedDate);
    const repreatingList = getRecurringEvents(recurrenceList.data, startOfDay(selectedDate), endOfDay(selectedDate));

    setEvents([...splitList, ...repreatingList]);
    setLoading(false);
  };

  useEffect(() => {
    fetchEvents();
  }, [selectedDate]);
*/

  const handleToday = () => {
    setCurrentMonth(new Date());
    setSelectedDate(new Date());
  };

  const filteredEvents = useMemo(() => {
    if (events) {
      return filterEventsByRoom(events, selectedRoomId);
    }
    return [];
  }, [events, selectedRoomId]);

  if (!events) return <>FETCHING???</>;
  if (isError) return <>ERROR</>;

  const { hours, earliestEventHour, latestEventHour } = getVisibleHours(visibleHours, events);

  const groupedEvents = events; //groupEvents(filteredEvents);

  return (
    <>
      <CalendarHeader view={"day"} selectedDate={selectedDate} events={events} isLoading={isLoading} />

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
                            {
                              //<EventBlock event={event} pixelSize={96} fetchData={fetchEvents} />
                            }
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
              startMonth={addYears(selectedDate, -25)}
              endMonth={addYears(selectedDate, 25)}
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
