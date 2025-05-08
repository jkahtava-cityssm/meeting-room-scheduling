import { IEvent } from "@/calendar/interfaces";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { format, isSameDay, parseISO } from "date-fns";
import { Clock, MapPin, Text } from "lucide-react";
import { SetStateAction } from "react";
import { twMerge } from "tailwind-merge";

export function ReadEvent({
  event,
  setIsEditable,
}: {
  event: IEvent;
  setIsEditable: (value: SetStateAction<boolean>) => void;
}) {
  const startDate = event.startDate;
  const endDate = event.endDate;
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <MapPin />
        <div>
          <p className="text-sm">{event.room.name}</p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Clock className="shrink-0" />
        <div>
          {isSameDay(event.endDate, event.startDate) ? (
            <p className="text-sm">{format(startDate, "MMM d, yyyy h:mm a") + " - " + format(endDate, "h:mm a")}</p>
          ) : (
            <p className="text-sm">
              {format(startDate, "MMM d, yyyy h:mm a") + " to " + format(endDate, "MMM d, yyyy h:mm a")}
            </p>
          )}
        </div>
      </div>
      <div>
        <div className="flex items-center gap-2 mb-2">
          <Text className="size-5 shrink-0" />
          <div>
            <p className="text-sm font-medium">Description</p>
          </div>
        </div>
        <div className="flex items-center gap-2 pl-7">
          {/*
            <ScrollArea className="h-[50vh]" type="always">
            <div className="flex overflow-hidden pr-3">
              <p className="text-sm ">{event.description}</p>
            </div>
          </ScrollArea>*/}
          <Textarea
            className={twMerge("max-h-80 resize-none disabled:opacity-100")}
            disabled={true}
            value={event.description}
          ></Textarea>
        </div>
      </div>
      <div className="flex gap-2 sm:flex-col-reverse md:flex-row md:justify-end ">
        <Button type="button" variant="outline" onClick={() => setIsEditable(true)}>
          Edit
        </Button>
      </div>
    </div>
  );
}
