"use client";
import { CalendarDayColumnCalendar } from "@/components/calendar/calendar-day-column-calendar";
import { EventBlock } from "@/components/calendar/calendar-day-event-block";
import { IEventBlock } from "@/components/calendar/calendar-day-view";
import { CalendarDayViewSkeleton } from "@/components/calendar/skeleton-calendar-day-view";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useSession } from "@/lib/auth-client";
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

  const { data: session, isPending } = useSession();

  const [filteredEvents, setFilteredEvents] = useState<IEvent[]>([]);
  const { data: events } = useUserEventsQuery(session?.user.id);

  useEffect(() => {
    if (!events) {
      return;
    }

    setFilteredEvents(events);
  }, [events]);

  if (isPending) {
    return <div>Verifying Access</div>;
  }

  if (!session) {
    console.log("User Requests No session, redirecting to login");
    redirect("/");
  }

  return (
    <>
      <div>THIS WILL BE A VIEW FOR RECEPTION TO APPROVE OR DENY BOOKINGS</div>
      <div className="flex">
        {isLoading ? (
          <CalendarDayViewSkeleton date={date} />
        ) : (
          <div className="flex flex-1 flex-col">
            <ScrollArea className="max-h-[50vh] md:max-h-[60vh] lg:max-h-[70vh] xl:max-h-[73vh]" type="always">
              <div className="flex border-l">
                {/* Day grid */}
                <div className="relative flex-1 border-b">
                  <div className="relative">
                    {filteredEvents &&
                      filteredEvents.map((event) => {
                        return (
                          <div
                            key={`day-${dayViews[0].day}-block-${format(new Date(), "yyyy-MM-dd-HH-mm")}-event-${
                              block.event.eventId
                            }`}
                            className="absolute p-1"
                            style={block.eventStyle}
                          >
                            <EventBlock
                              eventBlock={{
                                event: event,
                                eventStyle: { top: "1px", width: "10px", left: "110px" },
                                eventHeight: 100,
                                groupIndex: 1,
                                eventIndex: 1,
                              }}
                              heightInPixels={block.eventHeight}
                            />
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
    </>
  );
}
