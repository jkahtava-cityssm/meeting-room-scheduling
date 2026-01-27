import { format } from "date-fns";
import React from "react";

import { cn } from "@/lib/utils";
import EventDrawer from "@/app/features/event-drawer/event-drawer";

// Shared drawer context to avoid mounting many drawers — mount a single EventDrawer
const SharedDrawerContext = React.createContext<{
  open: (payload: { creationDate?: Date; event?: IEvent; userId?: string; roomId?: number }) => void;
} | null>(null);

function SharedEventDrawerProvider({ children }: { children: React.ReactNode }) {
  const triggerRef = React.useRef<HTMLButtonElement | null>(null);
  const [payload, setPayload] = React.useState<{
    creationDate?: Date;
    event?: IEvent;
    userId?: string;
    roomId?: number;
  } | null>(null);

  const open = React.useCallback((p: { creationDate?: Date; event?: IEvent; userId?: string; roomId?: number }) => {
    setPayload(p || null);
    // click the hidden trigger to open the sheet inside EventDrawer
    try {
      triggerRef.current?.click();
    } catch (e) {
      // ignore
    }
  }, []);

  return (
    <SharedDrawerContext.Provider value={{ open }}>
      {children}
      {/* Offscreen trigger wrapped by the single EventDrawer instance */}
      <div style={{ position: "absolute", left: -9999, width: 1, height: 1, overflow: "hidden" }}>
        <EventDrawer
          creationDate={payload?.creationDate}
          event={payload?.event}
          userId={payload?.userId}
          roomId={payload?.roomId}
        >
          <button ref={triggerRef} aria-hidden tabIndex={-1} />
        </EventDrawer>
      </div>
    </SharedDrawerContext.Provider>
  );
}

function useSharedDrawer() {
  const ctx = React.useContext(SharedDrawerContext);
  if (!ctx) throw new Error("useSharedDrawer must be used within SharedEventDrawerProvider");
  return ctx;
}
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { IBlock } from "./calendar-day-grid-webworker";
import { IEvent, IRoom } from "@/lib/schemas/calendar";
import { useRouter } from "next/navigation";
import { navigateURL } from "@/lib/helpers";
import { Button } from "@/components/ui/button";
import { GridEventBlock } from "./calendar-day-grid-event-block";
import { useCalendarDayGrid } from "./calendar-day-grid-context";
import { LoaderCircle } from "lucide-react";
import { CalendarDayViewSkeleton } from "@/components/calendar/skeleton-calendar-day-view";
import { CalendarDayColumnCalendar } from "@/components/calendar/calendar-day-column-calendar";

export const DailyTimeBlocks = React.memo(function DailyTimeBlocks({
  isLoading,
  selectedRoomId,
  visibleRooms,
  roomBlocks,
  dayIndex,
}: {
  isLoading: boolean;
  selectedRoomId: number;
  visibleRooms: IRoom[] | undefined;
  roomBlocks: Map<string, IBlock[]> | undefined;
  dayIndex: string;
}) {
  const { hours, currentDate } = useCalendarDayGrid();
  const roomsToRender = React.useMemo(
    () =>
      visibleRooms
        ?.filter((room) => selectedRoomId === -1 || room.roomId === selectedRoomId)
        .map((room) => {
          const blocks = roomBlocks?.get(String(room.roomId)) ?? [];
          return { roomId: room.roomId, roomName: room.name, blocks };
        }),
    [visibleRooms, selectedRoomId, roomBlocks],
  );

  const lastRoomId = roomsToRender?.length ? roomsToRender[roomsToRender.length - 1].roomId : undefined;

  const isMounting = !visibleRooms || !roomBlocks || !hours;

  if (isMounting) {
    return (
      <div className="flex">
        <CalendarDayViewSkeleton />
      </div>
    );
  }

  return (
    <SharedEventDrawerProvider>
      <ScrollArea className="w-full flex-1 min-h-0" type="always">
        <div className="flex min-w-0 w-max">
          <HourColumn currentDate={currentDate} hours={hours} />
          <div className="flex w-full min-w-0 pr-4">
            {roomsToRender?.map((room) => {
              return (
                <DayColumn
                  isLoading={isLoading}
                  key={room.roomId}
                  roomId={room.roomId}
                  roomName={room.roomName}
                  eventBlocks={room.blocks || []}
                  dayIndex={dayIndex}
                  isLastColumn={room.roomId === lastRoomId}
                />
              );
            })}
            {isLoading && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="flex flex-col bg-accent-foreground text-accent px-4 py-2 rounded ">
                  <LoaderCircle className="animate-spin" />
                </div>
              </div>
            )}
          </div>
        </div>
        <ScrollBar orientation="vertical" forceMount />
        <ScrollBar orientation="horizontal" forceMount />
      </ScrollArea>
    </SharedEventDrawerProvider>
  );
});
const HourColumn = React.memo(function HourColumn({ currentDate, hours }: { currentDate: Date; hours: number[] }) {
  const lastHour = hours[hours.length - 1] + 1;
  return (
    <div className="sticky left-0 z-10 bg-background min-w-18 border-r-2 pr-2 border-b-2  shrink-0">
      <div className="h-8"></div>
      <TimeBlockTopAnchor></TimeBlockTopAnchor>
      {hours.map((hour, index) => {
        return (
          <div key={hour} className="h-24 flex items-start pr-2">
            <span className="ml-auto -mt-1 text-xs text-muted-foreground">
              {format(new Date().setHours(hour), "hh a")}
            </span>
          </div>
        );
      })}
      <TimeBlockBottomAnchor title={format(new Date().setHours(lastHour), "hh a")}></TimeBlockBottomAnchor>
    </div>
  );
});

const DayColumn = React.memo(function DayColumn({
  isLoading,
  roomId,
  roomName,
  eventBlocks,
  dayIndex,
  isLastColumn,
}: {
  isLoading: boolean;
  roomId: number;
  roomName: string;
  eventBlocks: IBlock[];
  dayIndex: string;
  isLastColumn: boolean;
}) {
  const { hours, currentDate, userId, allowCreateEvent } = useCalendarDayGrid();
  return (
    <div className={cn("min-w-45 w-full border-b-2", isLastColumn && "border-r-2")}>
      <div className="sticky top-0 z-5 bg-background border-b-2 h-8 flex items-center justify-center">
        <span className="py-2 text-center text-xs font-medium text-muted-foreground">
          <span className="ml-1 font-semibold text-foreground">{roomName}</span>
        </span>
      </div>
      <TimeBlockTopAnchor showBackground={true}></TimeBlockTopAnchor>
      <div className="relative">
        <TimeBlocks roomId={roomId} />

        {!isLoading &&
          eventBlocks.map((block, blockIndex) => {
            return (
              <div
                key={`day-${dayIndex}-block-${blockIndex}-event-${block.event.eventId}`}
                className="absolute p-1"
                style={block.eventStyle}
              >
                {<GridEventBlock eventBlock={block} heightInPixels={block.eventHeight} userId={userId} />}
              </div>
            );
          })}
      </div>
      <TimeBlockBottomAnchor showBackground={true}></TimeBlockBottomAnchor>
    </div>
  );
});

const TimeBlocks = React.memo(function TimeBlocks({ roomId }: { roomId: number }) {
  const { hours, currentDate, userId, allowCreateEvent, interval } = useCalendarDayGrid();
  const clampedValue = clampToValidInterval(interval);
  const totalSlots = 60 / clampedValue;

  const slotIndices = React.useMemo(() => Array.from(Array(totalSlots).keys()), [totalSlots]);
  const middleIndex = React.useMemo(() => Math.max(0, Math.floor(totalSlots / 2) - 1), [totalSlots]);

  return React.useMemo(
    () =>
      hours?.map((hour, index) => {
        return (
          <div key={hour} className={cn("relative h-24")}>
            {index !== 0 && <div className="pointer-events-none absolute inset-x-0 top-0 border-b-2"></div>}
            {slotIndices.map((currentSlot) => {
              const startMinute = currentSlot * clampedValue;
              const showBottomSeparator = currentSlot === middleIndex;
              return (
                <TimeBlockEventDrawer
                  key={currentSlot}
                  roomId={roomId}
                  startMinute={startMinute}
                  currentDate={currentDate}
                  hour={hour}
                  allowCreateEvent={allowCreateEvent}
                  totalSlots={totalSlots}
                  userId={userId}
                  index={currentSlot}
                  showBottomSeparator={showBottomSeparator}
                />
              );
            })}
          </div>
        );
      }),
    [hours, slotIndices, clampedValue, roomId, currentDate, allowCreateEvent, totalSlots, userId, middleIndex],
  );
});

const TimeBlockEventDrawer = React.memo(function TimeBlockEventDrawer({
  currentDate,
  hour,
  startMinute,
  allowCreateEvent,
  userId,
  roomId,
  totalSlots,
  index,
  showBottomSeparator,
}: {
  currentDate: Date;
  hour: number;
  startMinute: number;
  allowCreateEvent: boolean;
  totalSlots: number;
  userId: string | undefined;
  roomId: number;
  index: number;
  showBottomSeparator?: boolean;
}) {
  const creationDate = React.useMemo(
    () => getDateTime(currentDate, hour, startMinute),
    [currentDate, hour, startMinute],
  );

  const shared = useSharedDrawer();

  if (!allowCreateEvent)
    return <TimeBlockButton totalSlots={totalSlots} index={index} showBottomSeparator={showBottomSeparator} />;

  // Fallback: if provider not present, just render the button
  if (!shared) {
    return (
      <div role="button" tabIndex={0}>
        <TimeBlockButton totalSlots={totalSlots} index={index} showBottomSeparator={showBottomSeparator} />
      </div>
    );
  }

  return (
    <div
      onPointerDown={() => shared.open({ creationDate, userId, roomId })}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") shared.open({ creationDate, userId, roomId });
      }}
    >
      <TimeBlockButton totalSlots={totalSlots} index={index} showBottomSeparator={showBottomSeparator} />
    </div>
  );
});
//<div className={cn("absolute inset-x-0 cursor-pointer transition-colors hover:bg-accent", height, top)} />

function TimeBlockBottomAnchor({
  title,
  showBackground = false,
  topBorder = false,
  bottomBorder = false,
}: {
  title?: string;
  showBackground?: boolean;
  topBorder?: boolean;
  bottomBorder?: boolean;
}) {
  return (
    <div
      className={cn(
        "relative h-4 ",
        showBackground && "bg-(--color-border) ",
        topBorder && "border-t-2",
        bottomBorder && "border-b-2",
      )}
    >
      {title && (
        <div className={"absolute right-2 flex items-center -top-2 h-4"}>
          <span className="text-xs text-muted-foreground">{title}</span>
        </div>
      )}
    </div>
  );
}

function TimeBlockTopAnchor({
  showBackground = false,
}: {
  title?: string;
  showBackground?: boolean;
  topBorder?: boolean;
  bottomBorder?: boolean;
}) {
  return <div className={cn("relative h-1.5 ", showBackground && "bg-(--color-border) ")}></div>;
}

const HEIGHTS: Record<number, string> = { 12: "h-2", 6: "h-4", 4: "h-6", 3: "h-8", 2: "h-12" } as const;
const TOPS: Record<number, string[]> = {
  12: [
    "top-0",
    "top-2",
    "top-4",
    "top-6",
    "top-8",
    "top-10",
    "top-12",
    "top-14",
    "top-16",
    "top-18",
    "top-20",
    "top-22",
  ],
  6: ["top-0", "top-4", "top-8", "top-12", "top-16", "top-20"],
  4: ["top-0", "top-6", "top-12", "top-18", "top-22"],
  3: ["top-0", "top-8", "top-16"],
  2: ["top-0", "top-12"],
  1: ["top-0"],
} as const;

const TimeBlockButton = React.memo(
  React.forwardRef<
    HTMLDivElement,
    React.HTMLAttributes<HTMLDivElement> & { totalSlots: number; index: number; showBottomSeparator?: boolean }
  >(function TimeBlockButton({ totalSlots, index, showBottomSeparator, className, ...props }, ref) {
    const height = HEIGHTS[totalSlots];
    const top = TOPS[totalSlots]?.[index];
    const separatorClass = showBottomSeparator ? "border-b border-dashed" : "";
    return (
      <div
        ref={ref}
        className={cn(
          "absolute inset-x-0 cursor-pointer transition-colors hover:bg-accent",
          height,
          top,
          separatorClass,
          className,
        )}
        {...props}
      />
    );
  }),
);

// separators are now drawn via inline background gradients on the hour container

function getDateTime(date: Date, hour: number, minute: number) {
  const newDate = new Date(date);
  newDate.setHours(hour, minute, 0, 0);
  return newDate;
}

const VALID_INTERVALS = [5, 10, 15, 20, 30, 60] as const;
const MINIMUM_INTERVAL = 5;
const MAXIMUM_INTERVAL = 60;

function clampToValidInterval(interval: number) {
  const bounded = Math.min(Math.max(interval, MINIMUM_INTERVAL), MAXIMUM_INTERVAL);
  return VALID_INTERVALS.reduce(
    (best, v) => (Math.abs(bounded - v) < Math.abs(bounded - best) ? v : best),
    VALID_INTERVALS[0],
  );
}
