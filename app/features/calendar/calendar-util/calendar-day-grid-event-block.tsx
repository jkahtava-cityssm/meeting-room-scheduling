import { cva } from "class-variance-authority";
import { format } from "date-fns";

import { TColors } from "@/lib/types";

import EventDrawer from "@/app/features/event-drawer/event-drawer";
import { sharedColorVariants } from "@/lib/theme/colorVariants";
import { IBlock } from "./calendar-day-grid-webworker";

const EventCard = cva(
  "flex select-none flex-col gap-0.5 truncate whitespace-nowrap rounded-md border px-1.5 py-0.5 text-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
  {
    variants: {
      color: sharedColorVariants,
    },
    defaultVariants: {
      color: "blue",
    },
  },
);

export function GridEventBlock({
  eventBlock,
  heightInPixels,
  userId,
}: {
  eventBlock: IBlock;
  heightInPixels: number;
  userId?: string;
}) {
  if (!eventBlock?.event) {
    return;
  }
  const color = eventBlock.event.room.color as TColors;

  const EventCardClasses = EventCard({ color });

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      if (e.currentTarget instanceof HTMLElement) e.currentTarget.click();
    }
  };

  return (
    <EventDrawer event={eventBlock.event} userId={userId}>
      <div
        role="button"
        tabIndex={0}
        className={EventCardClasses}
        style={{
          height: `${heightInPixels}px`,
        }}
        onKeyDown={handleKeyDown}
      >
        <div className="flex items-center gap-1.5 ">
          <p className="truncate font-semibold">{eventBlock.event.title}</p>
        </div>
        <div className="flex items-center gap-1.5 truncate">
          <p className="truncate">
            {format(eventBlock.event.startDate, "h:mm a")} - {format(eventBlock.event.endDate, "h:mm a")}
          </p>
        </div>
      </div>
    </EventDrawer>
  );
}
