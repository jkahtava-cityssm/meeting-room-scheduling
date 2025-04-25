import { IEvent } from "@/calendar/interfaces";
import { ScrollArea } from "@/components/ui/scroll-area";
import { format, isSameDay, parseISO } from "date-fns";
import { Clock, MapPin, Text } from "lucide-react";

export function ReadEvent({ event }: { event: IEvent }) {
  const startDate = parseISO(event.startDate);
  const endDate = parseISO(event.endDate);
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
        <div className="flex items-center gap-2">
          <Text className="size-5 shrink-0" />
          <div>
            <p className="text-sm font-medium">Description</p>
          </div>
        </div>
        <div className="flex items-center gap-2 pl-7">
          <ScrollArea className="h-[50vh]" type="always">
            <div className="flex overflow-hidden pr-3">
              <p className="text-sm ">{event.description}</p>
            </div>
          </ScrollArea>
        </div>
      </div>
    </div>
  );
}
