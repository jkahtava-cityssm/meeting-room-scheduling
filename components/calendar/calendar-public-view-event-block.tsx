import { cva } from "class-variance-authority";
import { format } from "date-fns";

import { TColors } from "../../lib/types";
import { IEventBlock } from "./calendar-day-view";

import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { sharedColorVariants } from "../ui/eventCardVariants";
import { TooltipPortal } from "@radix-ui/react-tooltip";

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

export function PublicEventBlock({ eventBlock, heightInPixels }: { eventBlock: IEventBlock; heightInPixels: number }) {
  if (!eventBlock?.event) {
    return;
  }
  const color = eventBlock.event.room.color as TColors;

  const EventCardClasses = PublicEventCard({ color: color as TColors });

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
          <div className="flex items-center">
            <p className="font-semibold text-wrap">Booked</p>
          </div>
          <div className="flex items-center text-wrap">
            <p>{timeRange}</p>
          </div>
          <div className="flex items-center pt-1">
            <p className="text-wrap">{eventBlock.event.title}</p>
          </div>
        </div>
      </TooltipTrigger>
      <TooltipPortal>
        <TooltipContent className="max-w-64" side="right" sticky="always">
          <div className="space-y-1">
            <div className="flex items-center gap-2 border-b border-muted-foreground h-8">
              <p className="text-sm font-medium">{eventBlock.event.room.name}</p>
            </div>
            <p className="text-primary-foreground/80 text-sm font-normal">Booked</p>
            <p className="text-primary-foreground/80 text-sm font-normal">{timeRange}</p>
            <p className="text-primary-foreground/80 text-sm font-normal">{eventBlock.event.title}</p>
          </div>
        </TooltipContent>
      </TooltipPortal>
    </Tooltip>
  );
}
