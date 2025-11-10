"use client";
import { CalendarHeader } from "@/components/calendar/calendar-all-header";
import { DateNavigator } from "@/components/calendar/calendar-all-header-date-navigator";
import { RoomSelect } from "@/components/calendar/calendar-all-header-room-select";
import { StatusSelect } from "@/components/calendar/calendar-all-header-status-select";
import { TodayButton } from "@/components/calendar/calendar-all-header-today-button";
import { CalendarDayColumnCalendar } from "@/components/calendar/calendar-day-column-calendar";
import { EventBlock } from "@/components/calendar/calendar-day-event-block";
import { CalendarDayViewSkeleton } from "@/components/calendar/skeleton-calendar-day-view";
import EventDrawer from "@/components/event-drawer/event-drawer";
import { BreakPointText } from "@/components/test/breakpoint";
import { ColorCycler } from "@/components/test/ColourChanger";
import { Badge } from "@/components/ui/badge";
import { BadgeColored } from "@/components/ui/badge-colored";
import { Button } from "@/components/ui/button";
import { ButtonColored } from "@/components/ui/button-colored";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useClientSession } from "@/hooks/use-client-auth";
import { IEvent } from "@/lib/schemas/calendar";
import { TColors } from "@/lib/types";
import { useEventQuery, useEventsByStatusQuery, useEventsQuery } from "@/services/events";
import { useUserEventsQuery } from "@/services/users";
import {
  startOfMonth,
  endOfMonth,
  format,
  isSameDay,
  differenceInHours,
  intervalToDuration,
  formatDuration,
} from "date-fns";
import { Clock, MapPin, Text, CalendarRange, Hourglass, Link } from "lucide-react";
import { redirect } from "next/navigation";
import { useEffect, useState } from "react";

export default function Home() {
  const isLoading = false;
  const date = new Date();
  const dayViews: { day: string }[] = [{ day: "test" }];

  const { session, isPending } = useClientSession();
  const startDate: Date = startOfMonth(date);
  const endDate: Date = endOfMonth(date);

  const [filteredEvents, setFilteredEvents] = useState<IEvent[]>([]);
  const { data: events } = useEventsByStatusQuery(startDate, endDate, "1");

  const [roomId, setRoomId] = useState<string>("-1");

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
    //console.log("User Requests No session, redirecting to login");
    redirect("/");
  }

  const breakpoints = true
    ? "w-(--public-calendar-sidebar-w-min) sm:w-(--public-calendar-sidebar-w-sm) lg:w-(--public-calendar-sidebar-w-lg) xl:w-(--public-calendar-sidebar-w-xl)"
    : "w-(--public-calendar-w-min) sm:w-(--public-calendar-w-sm) lg:w-(--public-calendar-w-lg)";

  return (
    <div className="overflow-hidden rounded-xl border min-w-92">
      <div className="flex flex-col gap-4 border-b p-4 min-w-90 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-3">
          <TodayButton view={"day"} />

          <DateNavigator view={"day"} selectedDate={new Date()} onPreviousClick={() => {}} onNextClick={() => {}} />
        </div>

        <div className="flex flex-col items-center gap-1.5 sm:flex-row sm:justify-between">
          <div className="flex w-full items-center gap-1.5"></div>
          <div className="w-full sm:w-auto">
            <RoomSelect selectedRoomId={roomId} onRoomChange={setRoomId} />
          </div>
          <div className="w-full sm:w-auto">
            <StatusSelect selectedStatusId="-1" onStatusChange={() => {}} />
          </div>
        </div>
      </div>
      <div className={`flex flex-1 flex-col ${breakpoints}`}>
        <ScrollArea className="min-h-[40vh] max-h-[70vh] overflow-y-auto" type="always">
          <div className="flex justify-center">
            <div className="flex flex-wrap justify-center gap-4 p-4 border-l border-b  max-w-screen-2xl">
              {filteredEvents?.map((event, index) => {
                const duration = formatDuration(
                  intervalToDuration({ start: new Date(event.startDate), end: new Date(event.endDate) }),
                  {
                    format: ["years", "months", "days", "hours", "minutes"],
                    delimiter: ", ",
                  }
                );

                const title = event.recurrenceId
                  ? "Recurring Event"
                  : !isSameDay(event.endDate, event.startDate)
                  ? "Multi-Day Event"
                  : "Single Day Event";

                const multiDayFormat = {
                  LineOne: `${format(event.startDate, "PP @ p")}`,
                  LineTwo: `${format(event.endDate, "PP @ p")}`,
                  LineThree: `${duration}`,
                };

                const singleDayFormat = {
                  LineOne: `${format(event.startDate, "PPP")}`,
                  LineTwo: `${format(event.startDate, "p")} - ${format(event.endDate, "p")}`,
                  LineThree: `${duration}`,
                };

                const recurringDayFormat = {
                  LineOne: `${format(event.startDate, "PPP")}`,
                  LineTwo: `${format(event.startDate, "p")} - ${format(event.endDate, "p")}`,
                  LineThree: `${duration}`,
                };

                const LineOne = event.recurrenceId
                  ? recurringDayFormat.LineOne
                  : isSameDay(event.endDate, event.startDate)
                  ? singleDayFormat.LineOne
                  : multiDayFormat.LineOne;
                const LineTwo = event.recurrenceId
                  ? recurringDayFormat.LineTwo
                  : isSameDay(event.endDate, event.startDate)
                  ? singleDayFormat.LineTwo
                  : multiDayFormat.LineTwo;
                const LineThree = event.recurrenceId
                  ? recurringDayFormat.LineThree
                  : isSameDay(event.endDate, event.startDate)
                  ? singleDayFormat.LineThree
                  : multiDayFormat.LineThree;

                return (
                  <Card key={index} className="w-100 p-2">
                    <CardHeader>
                      <CardTitle className="flex flex-row w-full justify-between items-center pb-2 mb-1 border-b">
                        {title}
                        <BadgeColored color={event.room.color as TColors}>{event.room.name}</BadgeColored>
                      </CardTitle>
                      <CardTitle className="flex flex-row w-full justify-between items-center">{event.title}</CardTitle>

                      <CardDescription>
                        <div className="flex flex-col gap-1">
                          <div className="mt-1 flex items-center gap-1">
                            <MapPin className="size-5 shrink-0" />
                            <p className="text-xs text-foreground font-medium">{event.room.name}</p>
                          </div>

                          <div className="flex items-center gap-1">
                            <CalendarRange className="size-5 shrink-0" />
                            <p className="text-xs text-foreground font-medium">{LineOne}</p>
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="size-5 shrink-0" />
                            <p className="text-xs text-foreground font-medium">{LineTwo}</p>
                          </div>
                          <div className="flex items-center gap-1">
                            <Hourglass className="size-5 shrink-0" />
                            <p className="text-xs text-foreground font-medium">{LineThree}</p>
                          </div>
                        </div>
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Text className="size-5 shrink-0" />
                          <div>
                            <p className="text-sm font-medium">Details</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 pl-7 ">
                          <p className="text-xs text-foreground line-clamp-6">{event.description}</p>
                        </div>
                      </div>
                    </CardContent>
                    <CardFooter className="flex flex-col-reverse sm:flex-row gap-2 mt-auto">
                      <ButtonColored color="green" className="w-full sm:w-1/3">
                        Approve
                      </ButtonColored>
                      <ButtonColored color="red" className="w-full sm:w-1/3">
                        Deny
                      </ButtonColored>
                      <EventDrawer event={event} userId={undefined}>
                        <Button variant={"outline"} className="w-full sm:w-1/3">
                          Review
                        </Button>
                      </EventDrawer>
                    </CardFooter>
                  </Card>
                );
              })}
            </div>
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}
