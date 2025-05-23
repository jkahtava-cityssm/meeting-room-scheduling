"use client";

import { startOfWeek, addDays, isSameDay, areIntervalsOverlapping, endOfWeek } from "date-fns";
import { useCalendar } from "@/contexts/calendar-context";
import { ScrollArea } from "@/components/ui/scroll-area";
import { CalendarTimeline } from "@/components/calendar/calendar-day-timeline";
import { groupEvents, getEventBlockStyle, getVisibleHours, filterEventsByRoom } from "@/lib/helpers";
import { DayHourlyEventDialogs } from "./calendar-day-event-block-add-hour-block";
import { HourColumn } from "./calendar-day-column-hourly";
import { ColumnDayHeader } from "./calendar-all-column-day-header";
import { EventBlock } from "./calendar-day-event-block";
import { useEffect, useMemo, useState } from "react";
import { useAllWeeklyEvents } from "@/services/events";
import { CalendarHeader } from "./calendar-all-header";
import { CalendarWeekViewSkeleton } from "./skeleton-calendar-week-view";

export function CalendarWeekView() {
  const { selectedDate, workingHours, visibleHours, selectedRoomId } = useCalendar();

  const { events, isLoading, isError } = useAllWeeklyEvents(selectedDate, visibleHours);

  const filteredEvents = useMemo(() => {
    if (events) {
      return filterEventsByRoom(events, selectedRoomId);
    }
    return [];
  }, [events, selectedRoomId]);

  const { hours, earliestEventHour, latestEventHour } = getVisibleHours(visibleHours, filteredEvents);

  const weekStart = startOfWeek(selectedDate);
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  return (
    <>
      <CalendarHeader view={"week"} selectedDate={selectedDate} events={filteredEvents} isLoading={isLoading} />
      <div className="flex flex-col items-center justify-center border-b py-4 text-sm text-muted-foreground sm:hidden">
        <p>Weekly view is not available on smaller devices.</p>
        <p>Please switch to daily or monthly view.</p>
      </div>

      <div className="hidden flex-col sm:flex">
        <div className="flex">
          <div className="flex flex-1 flex-col">
            {isLoading ? (
              <CalendarWeekViewSkeleton />
            ) : (
              <>
                <div>
                  <ColumnDayHeader weekDays={weekDays} />
                </div>
                <ScrollArea className="max-h-[50vh] md:max-h-[60vh] lg:max-h-[70vh] xl:max-h-[73vh]" type="always">
                  <div className="flex overflow-hidden">
                    {/* Hours column */}
                    <HourColumn hours={hours} />

                    {/* Week grid */}
                    <div className="relative flex-1 border-l">
                      <div className="grid grid-cols-7 divide-x">
                        {weekDays.map((day, dayIndex) => {
                          const dayEvents = filteredEvents.filter((event) => isSameDay(event.startDate, day));

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
                                      <EventBlock event={event} pixelSize={96} fetchData={async () => {}} />
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
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
