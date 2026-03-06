"use client";

import { format } from "date-fns";

import { TColors, TStatusKey } from "@/lib/types";
import { useEffect, useRef, useState } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { X } from "lucide-react";
import { cva } from "class-variance-authority";
import { sharedColorVariants } from "@/lib/theme/colorVariants";
import { useScrollPopoverDirection } from "./use-scroll-popover-direction";
import { IEventBlock } from "../webworkers/generic-webworker";

type Props = {
  viewport: HTMLDivElement | null;
  popoverLayer: HTMLDivElement | null;
  eventBlock: IEventBlock;
  heightInPixels: number;
};

const CLOSE_ALL_POPOVERS = "calendar-public-close-all-tooltips";

export const PublicEventCard = cva(
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

export function PublicEventBlock({ viewport, popoverLayer, eventBlock, heightInPixels }: Props) {
  const [popoverIsOpen, setPopoverOpen] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const closeTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const contentRef = useRef<HTMLDivElement>(null);

  const side = useScrollPopoverDirection({
    open: popoverIsOpen,
    triggerRef,
    contentRef,
    viewport,
    sideOffset: 10,
    collisionPadding: { top: 38, bottom: 10, left: 10, right: 10 },
    preferOrder: ["right", "left", "bottom", "top"], // option 1 + fallback
  });

  useEffect(() => {
    const handleGlobalClose = () => {
      setPopoverOpen(false);
      setIsLocked(false);
    };

    window.addEventListener(CLOSE_ALL_POPOVERS, handleGlobalClose);
    return () => window.removeEventListener(CLOSE_ALL_POPOVERS, handleGlobalClose);
  }, []);

  if (!eventBlock?.event) return null;

  const handleMouseEnter = () => {
    // Clear any pending "close" timer from this block
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
    }

    // if (triggerRef.current && document.activeElement !== triggerRef.current) {
    //  triggerRef.current.focus({ preventScroll: true });
    //}

    if (!popoverIsOpen) {
      //window.dispatchEvent(new CustomEvent(CLOSE_ALL_POPOVERS));
      setPopoverOpen(true);
    }
  };

  const handleMouseLeave = () => {
    // Wait 50ms before closing to see if we enter another block
    if (!isLocked) {
      closeTimeoutRef.current = setTimeout(() => {
        setPopoverOpen(false);
        if (document.activeElement === triggerRef.current) {
          triggerRef.current?.blur();
        }
      }, 100);
    }
  };

  const handleBlockClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // Toggle the lock. If locking it, ensure it's open.
    // If unlocking it, let it stay open until mouse leaves.
    if (isLocked) {
      // If already locked, clicking again should close it entirely
      setPopoverOpen(false);
      setIsLocked(false);
    } else {
      // If hovering (open but not locked) or closed, clicking locks it
      window.dispatchEvent(new CustomEvent(CLOSE_ALL_POPOVERS));
      setPopoverOpen(true);
      setIsLocked(true);
    }
  };

  const handleOpenChange = (isOpen: boolean) => {
    setPopoverOpen(isOpen);
    // If Radix closes it (via Escape or clicking outside), reset the lock
    if (!isOpen) {
      setIsLocked(false);
    }
  };

  const handleFocus = (e: React.FocusEvent<HTMLDivElement>) => {
    const container = viewport;
    const element = e.currentTarget;

    if (container && element) {
      const containerRect = container?.getBoundingClientRect();
      const elementRect = element.getBoundingClientRect();

      const customOffset = 40;

      const isVisible =
        elementRect.top >= containerRect.top + customOffset && // 20 is your offset
        elementRect.bottom <= containerRect.bottom;

      // 1. Find the element's position relative to the viewport's top

      if (!isVisible) {
        const relativeTop = elementRect.top - containerRect.top;

        container.scrollBy({
          top: relativeTop - customOffset,
          behavior: "smooth",
        });
      }
    }
    handleMouseEnter();
  };

  const isApproved = eventBlock.event.status.key === ("APPROVED" as TStatusKey);
  const color: TColors = isApproved ? (eventBlock.event.room.color as TColors) : ("disabled" as TColors);

  const eventCardClasses = PublicEventCard({ color });
  const timeRange = `${format(eventBlock.event.startDate, "h:mm a")} - ${format(eventBlock.event.endDate, "h:mm a")}`;

  //if (!viewportElement || !popoverElement) return;

  if (!viewport || !popoverLayer) return null;

  return (
    <Popover open={popoverIsOpen} onOpenChange={handleOpenChange}>
      {/* Wrapping the trigger in a div allows us to handle hover 
         without breaking the underlying Shadcn/Radix button logic 
      */}
      <div
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onClick={handleBlockClick}
        onBlur={handleMouseLeave}
        onFocus={handleFocus}
        className="w-full"
      >
        <PopoverTrigger asChild>
          <button
            ref={triggerRef}
            type="button"
            aria-label={`${isApproved ? "Booked" : "Requested"} from ${timeRange}, ${eventBlock.event.title}, in ${eventBlock.event.room.name}`}
            className={cn(
              eventCardClasses,
              "w-full text-left overflow-hidden outline-none focus-visible:ring-2 ring-ring ring-offset-2 transition-shadow",
            )}
            style={{ height: `${heightInPixels}px`, scrollMarginTop: "-48px" }}
          >
            <div className="flex flex-col gap-0.5" aria-hidden="true">
              <p className="flex text-left font-semibold text-wrap">{isApproved ? "Booked" : "Requested"}</p>
              <p className="flex text-wrap text-left">{timeRange}</p>
              <p className="flex pt-1 text-left text-wrap">{eventBlock.event.title}</p>
            </div>
          </button>
        </PopoverTrigger>
      </div>

      <PopoverContent
        ref={contentRef}
        container={popoverLayer}
        collisionBoundary={viewport}
        side={side}
        sideOffset={10}
        align="start"
        sticky="always"
        collisionPadding={{ top: 38, bottom: 10, left: 10, right: 10 }}
        avoidCollisions={true}
        //hideWhenDetached={true}
        onOpenAutoFocus={(e) => e.preventDefault()}
        onCloseAutoFocus={(e) => e.preventDefault()}
        onInteractOutside={(e) => {
          if (isLocked) {
            e.preventDefault();
          }
        }}
        aria-hidden="true"
        role="tooltip"
        className={cn(
          "w-64 p-3 shadow-xl z-5",

          isLocked ? "pointer-events-auto" : "pointer-events-none",
        )}
      >
        {isLocked && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              setPopoverOpen(false);
              setIsLocked(false);
            }}
            tabIndex={-1} // Keeps it out of the tab flow since it's aria-hidden
            className="absolute top-2 right-2 p-1 rounded-md hover:bg-muted transition-colors text-muted-foreground"
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </button>
        )}
        <div className="space-y-1 ">
          <div className="flex items-center gap-2 border-b border-muted-foreground h-8">
            <p className="text-sm font-medium">{eventBlock.event.room.name}</p>
          </div>

          <p className="text-primary/80 text-sm font-normal">{isApproved ? "Booked" : "Requested"}</p>
          <p className="text-primary/80 text-sm font-normal">{timeRange}</p>
          <p className="text-primary/80 text-sm font-normal">{eventBlock.event.title}</p>
          <div
            className={cn(
              "pt-2 mt-2 border-t border-muted/50 flex items-center gap-1.5 text-[10px] font-medium text-muted-foreground  tracking-wider",
              !isLocked && "opacity-70",
            )}
          >
            <div
              className={cn("h-1.5 w-1.5 rounded-full", isLocked ? "bg-amber-500 animate-pulse" : "bg-primary/70")}
            />
            {isLocked ? "Click to unpin" : "Click to pin"}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
