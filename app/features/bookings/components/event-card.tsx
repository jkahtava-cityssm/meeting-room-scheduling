import EventDrawer from "@/components/event-drawer/event-drawer";
import { BadgeColored } from "@/components/ui/badge-colored";
import { Button } from "@/components/ui/button";
import { ButtonColored } from "@/components/ui/button-colored";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { IEvent } from "@/lib/schemas/calendar";
import { CalendarRange, CalendarSync, Clock, Hourglass, MapPin, Text } from "lucide-react";
import { IEventCardFields } from "./types";
import { TColors } from "@/lib/types";
import { IconColored } from "@/components/ui/icon-colored";
import DynamicIcon, { IconName } from "@/components/ui/icon-dynamic";

export default function EventCard({
  eventCardFields,
  event,
  OnApprove,
  OnDeny,
}: {
  eventCardFields: IEventCardFields;
  event: IEvent;
  OnApprove: () => void;
  OnDeny: () => void;
}) {
  return (
    <Card className="w-100 p-2">
      <CardHeader>
        <CardTitle className="flex flex-row w-full justify-between items-center pb-2 mb-1 border-b">
          {eventCardFields.eventTitle}
          <BadgeColored color={eventCardFields.color}>{eventCardFields.roomName}</BadgeColored>
        </CardTitle>
        <CardTitle className="flex flex-row w-full justify-between items-center">
          {eventCardFields.cardTitle}

          <BadgeColored color={event.status.color as TColors} className="h-6">
            <DynamicIcon
              hideBackground={true}
              color={event.status.color as TColors}
              name={event.status.icon as IconName}
              className={"h-4 w-4"}
            ></DynamicIcon>
            {event.status.name}
          </BadgeColored>
        </CardTitle>

        <CardDescription>
          <div className="flex flex-col gap-1">
            <div className="mt-1 flex items-center gap-1">
              <MapPin className="size-5 shrink-0" />
              <p className="text-xs text-foreground font-medium">{eventCardFields.roomName}</p>
            </div>

            <div className="flex items-center gap-1">
              <CalendarRange className="size-5 shrink-0" />
              <p className="text-xs text-foreground font-medium">{eventCardFields.dateRange}</p>
            </div>
            <div className="flex items-center gap-1">
              <Clock className="size-5 shrink-0" />
              <p className="text-xs text-foreground font-medium">{eventCardFields.timeRange}</p>
            </div>
            <div className="flex items-center gap-1">
              <Hourglass className="size-5 shrink-0" />
              <p className="text-xs text-foreground font-medium">{eventCardFields.duration}</p>
            </div>
            {eventCardFields.recurrence && (
              <div className="flex items-center gap-1">
                <CalendarSync className="size-5 shrink-0" />
                <p className="text-xs text-foreground font-medium">{eventCardFields.recurrence}</p>
              </div>
            )}
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
            <p className="text-xs text-foreground line-clamp-6 min-h-24">{eventCardFields.description}</p>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex flex-col-reverse sm:flex-row gap-2 mt-auto">
        {event.status.name !== "Confirmed" && (
          <ButtonColored color="green" className="w-full sm:w-1/3" onClick={OnApprove}>
            Confirm
          </ButtonColored>
        )}
        {event.status.name !== "Rejected" && (
          <ButtonColored color="red" className="w-full sm:w-1/3" onClick={OnDeny}>
            Reject
          </ButtonColored>
        )}
        {event.status.name !== "Pending Review" && (
          <ButtonColored color="slate" className="w-full sm:w-1/3" onClick={OnDeny}>
            Pending
          </ButtonColored>
        )}
        <EventDrawer event={event} userId={undefined}>
          <Button variant={"outline"} className="w-full sm:w-1/3">
            Review
          </Button>
        </EventDrawer>
      </CardFooter>
    </Card>
  );
}
