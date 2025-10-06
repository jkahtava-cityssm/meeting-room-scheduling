"use client";
import { CalendarAllViews } from "@/components/calendar/calendar-all-views";
import { CalendarDayColumnCalendar } from "@/components/calendar/calendar-day-column-calendar";
import { EventBlock } from "@/components/calendar/calendar-day-event-block";
import { IEventBlock } from "@/components/calendar/calendar-day-view";
import { CalendarDayViewSkeleton } from "@/components/calendar/skeleton-calendar-day-view";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useClientSession } from "@/hooks/use-client-auth";

import { IEvent } from "@/lib/schemas/calendar";
import { useEventsQuery } from "@/services/events";
import { useUserEventsQuery } from "@/services/users";
import { format } from "date-fns";
import { redirect } from "next/navigation";
import { useEffect, useState } from "react";

export default function Home() {
  const isLoading = false;
  const date = new Date();
  const dayViews: { day: string }[] = [{ day: "test" }];
  const block: IEventBlock = {
    event: { eventId: 1 },
    eventStyle: { top: "1px", width: "10px", left: "110px" },
    eventHeight: 100,
  };

  const { session, isPending } = useClientSession();

  if (isPending) {
    return <div>Verifying Access</div>;
  }

  if (!session) {
    console.log("User Requests No session, redirecting to login");
    redirect("/");
  }

  return (
    <div>
      <CalendarAllViews userId={session?.user.id} />
    </div>
  );
}

/*<div className="overflow-hidden rounded-xl border min-w-92">
      <div>EVERY STAFF MEMBER WILL SEE THIS PAGE SO THEY CAN REQUEST ADJUSTMENTS OR CANCELLATIONS</div>
      <div className="flex">
        {isLoading ? (
          <CalendarDayViewSkeleton date={date} />
        ) : (
          <div className="flex flex-1 flex-col">
            <ScrollArea className="max-h-[50vh] md:max-h-[60vh] lg:max-h-[70vh] xl:max-h-[73vh]" type="always">
              <div className="flex border-l">
                <div className="relative flex-1 border-b">
                  <div className="relative">
                    {filteredEvents &&
                      filteredEvents.map((event) => {
                        return (
                          <div key={`${event.eventId}`}>
                            <div
                              role="button"
                              tabIndex={0}
                              className={
                                "flex select-none flex-col gap-0.5 truncate whitespace-nowrap rounded-md border px-1.5 py-0.5 text-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring border-red-200 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-300 [&_.event-dot]:fill-red-600"
                              }
                              style={{
                                height: `150px`,
                              }}
                            >
                              <div className="flex items-center gap-1.5 ">
                                <p className="truncate font-semibold">{event.title}</p>
                              </div>
                              <div className="flex items-center gap-1.5 truncate">
                                <p className="truncate">
                                  {format(event.startDate, "h:mm a")} - {format(event.endDate, "h:mm a")}
                                </p>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </div>
              </div>
            </ScrollArea>
          </div>
        )}
        <CalendarDayColumnCalendar
          date={date}
          isLoading={isLoading}
          events={filteredEvents}
          view={"day"}
        ></CalendarDayColumnCalendar>
      </div>
    </div>
  );
  */
