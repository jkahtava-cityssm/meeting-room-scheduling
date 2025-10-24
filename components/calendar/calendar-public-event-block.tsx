import { cva } from "class-variance-authority";
import { format } from "date-fns";

import { TColors } from "../../lib/types";
import { IEventBlock } from "./calendar-day-view";

import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { sharedColorVariants } from "../ui/eventCardVariants";

export const PublicEventCard = cva(
  "flex select-none flex-col gap-0.5 truncate whitespace-nowrap rounded-md border px-1.5 py-0.5 text-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
  {
    variants: {
      color: sharedColorVariants,
    },
    defaultVariants: {
      color: "blue",
    },
  }
);

export function PublicEventBlock({
  eventBlock,
  heightInPixels,
  colour,
}: {
  eventBlock: IEventBlock;
  heightInPixels: number;
  colour?: TColors;
}) {
  if (!eventBlock?.event) {
    return;
  }
  const color = eventBlock.event.room.color as TColors;

  const EventCardClasses = PublicEventCard({ color: colour as TColors });

  const timeRange = `${format(eventBlock.event.startDate, "h:mm a")} - ${format(eventBlock.event.endDate, "h:mm a")}`;
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div
          role="button"
          tabIndex={0}
          className={EventCardClasses}
          style={{
            height: `${heightInPixels}px`,
          }}
        >
          <div className="flex items-center gap-1.5 ">
            <p className="truncate font-semibold">{eventBlock.event.title ?? "Booked"}</p>
          </div>
          <div className="flex items-center gap-1.5 truncate">
            <p className="truncate">{timeRange}</p>
          </div>
        </div>
      </TooltipTrigger>
      <TooltipContent className="max-w-64" side="right">
        <div className="space-y-1">
          <div className="flex items-center gap-2 border-b border-muted-foreground h-8">
            <p className="text-sm font-medium">{eventBlock.event.room.name}</p>
          </div>
          <p className="text-primary-foreground/80 text-sm font-normal">Booked</p>
          <p className="text-primary-foreground/80 text-sm font-normal">{timeRange}</p>
        </div>
      </TooltipContent>
    </Tooltip>
  );
}
