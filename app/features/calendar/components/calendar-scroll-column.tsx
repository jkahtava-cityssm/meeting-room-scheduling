import { cn } from "@/lib/utils";
import { IBlock } from "../calendar-day-grid/calendar-day-grid-webworker";
import { GridEventBlock } from "../calendar-day-grid/calendar-day-grid-event-block";
import { ButtonHTMLAttributes, forwardRef, HTMLAttributes, memo, useCallback, useMemo } from "react";
import { useSharedEventDrawer } from "../../event-drawer/shared-event-drawer-context";
import { CalendarPermissions } from "../permissions/calendar.permissions";

export const CalendarScrollColumn = memo(function ContentColumn({
  loadingBlocks,
  title,
  interval,
  hours,
  roomId,
  userId,
  eventBlocks,
  isLastColumn,
  currentDate,
}: {
  loadingBlocks: boolean;
  title: string;
  interval: number;
  roomId: number | undefined;
  userId: string | undefined;
  hours: number[];
  eventBlocks: IBlock[];
  isLastColumn: boolean;
  currentDate: Date;
}) {
  const validInterval = clampToValidInterval(interval);
  const totalBlocks = 60 / validInterval;
  const middleBlock = useMemo(() => Math.max(0, Math.floor(totalBlocks / 2) - 1), [totalBlocks]);

  return (
    <div className={cn("min-w-45 w-full border-b-2", isLastColumn && "border-r-2")}>
      <div className="sticky top-0 z-5 bg-background border-b-2 h-8 flex items-center justify-center">
        <span className="ml-1 text-xs font-semibold text-foreground">{title}</span>
      </div>
      <div className=" border-t-6 border-b-16">
        <div className="relative">
          {hours?.map((hour, index) => {
            return (
              <div key={hour} className={"relative h-24"}>
                {index !== 0 && <div className="pointer-events-none absolute inset-x-0 top-0 border-b-2"></div>}
                {Array.from({ length: totalBlocks }, (_, blockIndex) => {
                  const startMinute = blockIndex * validInterval;
                  const showBottomSeparator = blockIndex === middleBlock;
                  return (
                    <TimeBlockEventDrawer
                      key={blockIndex}
                      roomId={roomId}
                      userId={userId}
                      hour={hour}
                      startMinute={startMinute}
                      currentDate={currentDate}
                      totalBlocks={totalBlocks}
                      blockIndex={blockIndex}
                      showBottomSeparator={showBottomSeparator}
                    />
                  );
                })}
              </div>
            );
          })}

          {!loadingBlocks &&
            eventBlocks.map((block, blockIndex) => {
              return (
                <div
                  key={`block-${blockIndex}-event-${block.event.eventId}`}
                  className="absolute p-1"
                  style={block.eventStyle}
                >
                  {<GridEventBlock eventBlock={block} heightInPixels={block.eventHeight} userId={userId} />}
                </div>
              );
            })}
        </div>
      </div>
    </div>
  );
});

const TimeBlockEventDrawer = memo(function TimeBlockEventDrawer({
  currentDate,
  hour,
  startMinute,
  userId,
  roomId,
  totalBlocks,
  blockIndex,
  showBottomSeparator,
}: {
  currentDate: Date;
  hour: number;
  startMinute: number;
  totalBlocks: number;
  userId: string | undefined;
  roomId: number | undefined;
  blockIndex: number;
  showBottomSeparator?: boolean;
}) {
  const creationDate = useMemo(() => getDateTime(currentDate, hour, startMinute), [currentDate, hour, startMinute]);
  const { openEventDrawer } = useSharedEventDrawer();

  const { can, isVerifying } = CalendarPermissions.usePermissions();
  const allowed = !isVerifying && can("CreateEvent");

  const openDrawer = useCallback(() => {
    if (!allowed) return undefined;
    openEventDrawer({ creationDate: creationDate, userId: userId, roomId: roomId });
  }, [allowed, openEventDrawer, creationDate, userId, roomId]);

  return (
    <TimeBlockButton
      totalBlocks={totalBlocks}
      blockIndex={blockIndex}
      showBottomSeparator={showBottomSeparator}
      disabled={!allowed}
      onClick={openDrawer}
    />
  );
});

const TimeBlockButton = memo(
  forwardRef<
    HTMLButtonElement,
    ButtonHTMLAttributes<HTMLButtonElement> & { totalBlocks: number; blockIndex: number; showBottomSeparator?: boolean }
  >(function TimeBlockButton({ totalBlocks, blockIndex, showBottomSeparator, disabled, className, ...props }, ref) {
    const height = HEIGHTS[totalBlocks];
    const top = TOPS[totalBlocks]?.[blockIndex];
    const separatorClass = showBottomSeparator ? "border-b border-dashed" : "";
    return (
      <button
        ref={ref}
        type="button"
        disabled={disabled}
        className={cn(
          "absolute inset-x-0 transition-colors ",
          disabled ? "cursor-default" : "cursor-pointer hover:bg-accent",
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
