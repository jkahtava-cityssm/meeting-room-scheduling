"use client";

import * as React from "react";
import { format } from "date-fns";
import { IEventBlock } from "./calendar-public-view";
import { useIsTouch } from "@/hooks/use-is-touch";
import { TColors, TStatusKey } from "@/lib/types";
import { PublicEventCard } from "./calendar-public-view-event-block";
import { useState } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { cn } from "@/lib/utils";

type Props = {
  viewportRef: React.RefObject<HTMLDivElement | null>;
  eventBlock: IEventBlock;
  heightInPixels: number;
};

export function PublicEventBlockHybrid({ viewportRef, eventBlock, heightInPixels }: Props) {
  const isTouch = useIsTouch();
  const [popoverIsOpen, setPopoverOpen] = useState(false);

  if (!eventBlock?.event) return null;

  const isApproved = eventBlock.event.status.key === ("APPROVED" as TStatusKey);
  const color: TColors = isApproved ? (eventBlock.event.room.color as TColors) : ("disabled" as TColors);

  const EventCardClasses = PublicEventCard({ color });
  const timeRange = `${format(eventBlock.event.startDate, "h:mm a")} - ${format(eventBlock.event.endDate, "h:mm a")}`;

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      setPopoverOpen(false);
      return;
    }
    // Open on Space / Enter and prevent Space from scrolling
    if (e.key === " " || e.key === "Spacebar" || e.key === "Enter") {
      e.preventDefault(); // blocks default scrolling for Space
      setPopoverOpen((prev) => !prev);
    }
  };

  const handleFocus = () => {
    console.log("Focus Event");
    setPopoverOpen(true);
  };
  const handleBlur = (e: React.FocusEvent) => {
    // close only if focus truly leaves the trigger
    const eventTarget = e.currentTarget;
    setTimeout(() => {
      const activeElement = document.activeElement;

      const stillInside = !!activeElement && eventTarget.contains(activeElement);
      if (!stillInside) {
        console.log(
          "Blur Event Active: ",
          activeElement?.childNodes[1].childNodes[0].textContent,
          "Target: ",
          eventTarget?.childNodes[1].childNodes[0].textContent,
        );
        setPopoverOpen(false);
      }
    }, 50);
  };

  // Shared trigger markup
  const Trigger = (
    <button
      type="button"
      tabIndex={0}
      className={cn(EventCardClasses, `w-full`)}
      style={{ height: `${heightInPixels}px` }}
      onFocus={handleFocus}
      onBlur={handleBlur}
      onKeyDown={onKeyDown}
    >
      <div className="flex">
        <p className="text-left font-semibold text-wrap">{isApproved ? "Booked" : "Requested"}</p>
      </div>
      <div className="flex text-wrap">
        <p className="text-left">{timeRange}</p>
      </div>
      <div className="flex pt-1">
        <p className="text-left text-wrap">{eventBlock.event.title}</p>
      </div>
    </button>
  );

  const OverlayContent = (
    <div className="space-y-1">
      <div className="flex items-center gap-2 border-b border-muted-foreground h-8">
        <p className="text-sm font-medium">{eventBlock.event.room.name}</p>
      </div>

      <p className="text-primary/80 text-sm font-normal">{isApproved ? "Booked" : "Requested"}</p>
      <p className="text-primary/80 text-sm font-normal">{timeRange}</p>
      <p className="text-primary/80 text-sm font-normal">{eventBlock.event.title}</p>
    </div>
  );

  return (
    <Popover
      modal={false}
      open={popoverIsOpen}
      onOpenChange={(value) => {
        console.log("Popover onOpenChange: ", value);
        //setPopoverOpen(value);
      }}
    >
      <PopoverTrigger
        asChild
        onClick={() => {
          console.log("PopoverTrigger OnClick: ");
          //setPopoverOpen((prev) => !prev);
        }}
      >
        {Trigger}
      </PopoverTrigger>
      <PopoverContent
        container={viewportRef.current ?? undefined}
        className="w-fit max-w-64 px-3 py-1.5"
        side="right"
        sideOffset={8}
        avoidCollisions
        collisionBoundary={viewportRef.current ?? undefined}
        collisionPadding={8}
        // prevent autofocus jumps on open/close
        onOpenAutoFocus={(e) => e.preventDefault()}
        onCloseAutoFocus={(e) => e.preventDefault()}
      >
        {OverlayContent}
      </PopoverContent>
    </Popover>
  );

  // --- Desktop mouse: HoverCard (delayed open/close, hover only)
  return (
    <HoverCard open={popoverIsOpen} onOpenChange={setPopoverOpen} openDelay={150} closeDelay={100}>
      <HoverCardTrigger asChild>{Trigger}</HoverCardTrigger>

      {/* Portal to the ScrollArea viewport */}

      <HoverCardContent
        container={viewportRef.current ?? undefined}
        className="w-fit max-w-64 px-3 py-1.5"
        side="right"
        sideOffset={8}
        avoidCollisions
        collisionBoundary={viewportRef.current ?? undefined}
        collisionPadding={8}
      >
        {OverlayContent}
      </HoverCardContent>
    </HoverCard>
  );
}
