import { cn } from "@/lib/utils";
import { IBlock } from "../calendar-day-grid/calendar-day-grid-webworker";
import { GridEventBlock } from "../calendar-day-grid/calendar-day-grid-event-block";
import { Fragment, ReactNode, ButtonHTMLAttributes, forwardRef, memo, useCallback, useMemo } from "react";
import { useSharedEventDrawer } from "../../event-drawer/shared-event-drawer-context";
import { CalendarPermissions } from "../permissions/calendar.permissions";

export type PrivateCallback = {
  currentDate: Date;
  hour: number;
  startMinute: number;
  userId: string | undefined;
  roomId: number | undefined;
};

export type TimeBlockRenderProps = {
  roomId: number | undefined;
  userId: string | undefined;
  hour: number;
  startMinute: number;
  currentDate: Date;
  totalBlocks: number;
  blockIndex: number;
  showBottomSeparator: boolean;
};

export type CalendarScrollColumnProps = {
  loadingBlocks: boolean;
  title: string;
  interval: number;
  roomId: number | undefined;
  userId: string | undefined;
  hours: number[];
  eventBlocks: IBlock[];
  isLastColumn: boolean;
  currentDate: Date;
  renderTimeBlock: (p: TimeBlockRenderProps) => ReactNode;
};

export function CalendarScrollColumnPrivate(props: Omit<CalendarScrollColumnProps, "renderTimeBlock">) {
  const { can, isVerifying } = CalendarPermissions.usePermissions();
  const allowed = !isVerifying && can("CreateEvent");

  const renderTimeBlock = useCallback(
    (p: TimeBlockRenderProps) => (
      <TimeBlockEventDrawer
        roomId={p.roomId}
        userId={p.userId}
        hour={p.hour}
        startMinute={p.startMinute}
        currentDate={p.currentDate}
        totalBlocks={p.totalBlocks}
        blockIndex={p.blockIndex}
        showBottomSeparator={p.showBottomSeparator}
        createEventAllowed={allowed}
      />
    ),
    [allowed],
  );

  return <CalendarScrollColumnBase {...props} renderTimeBlock={renderTimeBlock} />;
}

export function CalendarScrollColumnPublic(props: Omit<CalendarScrollColumnProps, "renderTimeBlock">) {
  const renderTimeBlock = useCallback(
    ({ totalBlocks, blockIndex, showBottomSeparator, hour, startMinute }: TimeBlockRenderProps) => (
      <TimeBlockButton
        totalBlocks={totalBlocks}
        blockIndex={blockIndex}
        showBottomSeparator={showBottomSeparator}
        disabled={true}
        aria-label={`Time slot ${hour}:${String(startMinute).padStart(2, "0")}`}
      />
    ),
    [],
  );

  return <CalendarScrollColumnBase {...props} renderTimeBlock={renderTimeBlock} />;
}
const CalendarScrollColumnBase = memo(function CalendarScrollColumnBase({
  interval,
  hours,
  renderTimeBlock,
  isLastColumn,
  title,
  loadingBlocks,
  eventBlocks,
  userId,
  roomId,
  currentDate,
}: CalendarScrollColumnProps) {
  const validInterval = clampToValidInterval(interval);
  const totalBlocks = 60 / validInterval;

  // Logic to find which block index should have the dashed middle line
  const middleBlockIndex = useMemo(() => Math.max(0, Math.floor(totalBlocks / 2) - 1), [totalBlocks]);

  return (
    <div className={cn("min-w-45 w-full border-b-2", isLastColumn && "border-r-2")}>
      {/* Sticky Header */}
      <div className="sticky top-0 z-20 bg-background border-b-2 h-8 flex items-center justify-center">
        <span className="text-xs font-semibold">{title}</span>
      </div>

      <div className="relative border-t-6 border-b-16">
        {hours.map((hour, index) => (
          <div
            key={hour}
            className="grid w-full h-24 relative"
            style={{
              // 1. CSS Grid handles the sizing automatically
              gridTemplateRows: `repeat(${totalBlocks}, 1fr)`,
              // 2. Performance: browser skips rendering logic for off-screen hours
              contentVisibility: "auto",
              containIntrinsicSize: "auto 96px", // h-24 = 96px
            }}
          >
            {/* Hour Boundary Line */}
            {index !== 0 && <div className="pointer-events-none absolute inset-x-0 top-0 border-t-2 z-10" />}

            {Array.from({ length: totalBlocks }, (_, blockIndex) => (
              <Fragment key={`${hour}-${blockIndex}`}>
                {renderTimeBlock({
                  roomId,
                  userId,
                  hour,
                  startMinute: blockIndex * validInterval,
                  currentDate,
                  totalBlocks,
                  blockIndex,
                  showBottomSeparator: blockIndex === middleBlockIndex,
                })}
              </Fragment>
            ))}
          </div>
        ))}

        {/* Absolute Event Blocks Layer */}
        {!loadingBlocks &&
          eventBlocks.map((block) => (
            <div
              key={`event-${block.event.eventId}-${block.event.startDate}`}
              className="absolute p-1 z-20 pointer-events-auto"
              style={block.eventStyle}
            >
              <GridEventBlock eventBlock={block} heightInPixels={block.eventHeight} userId={userId} />
            </div>
          ))}
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
  createEventAllowed,
  showBottomSeparator,
}: {
  currentDate: Date;
  hour: number;
  startMinute: number;
  totalBlocks: number;
  userId: string | undefined;
  roomId: number | undefined;
  blockIndex: number;
  createEventAllowed: boolean;
  showBottomSeparator?: boolean;
}) {
  const creationDate = useMemo(() => getDateTime(currentDate, hour, startMinute), [currentDate, hour, startMinute]);
  const { openEventDrawer } = useSharedEventDrawer();

  const openDrawer = useCallback(() => {
    if (!createEventAllowed) return;
    openEventDrawer({ creationDate, userId, roomId });
  }, [createEventAllowed, openEventDrawer, creationDate, userId, roomId]);

  return (
    <TimeBlockButton
      totalBlocks={totalBlocks}
      blockIndex={blockIndex}
      showBottomSeparator={showBottomSeparator}
      disabled={!createEventAllowed}
      onClick={openDrawer}
      aria-label={`Create event at ${hour}:${String(startMinute).padStart(2, "0")}`}
    />
  );
});

const TimeBlockButton = memo(function TimeBlockButton({
  disabled,
  showBottomSeparator,
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { showBottomSeparator?: boolean }) {
  return (
    <button
      type="button"
      disabled={disabled}
      className={cn(
        "w-full h-full transition-colors relative outline-none",
        // Focus state for keyboard accessibility
        "focus-visible:bg-accent focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary",
        disabled ? "cursor-default pointer-events-none" : "hover:bg-accent cursor-pointer",
        // Draw the middle dashed line
        showBottomSeparator &&
          "after:absolute after:bottom-0 after:inset-x-0 after:border-b after:border-dashed after:pointer-events-none",
        className,
      )}
      {...props}
    />
  );
});

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

const HEIGHTS: Record<number, string> = { 12: "h-2", 6: "h-4", 4: "h-6", 3: "h-8", 2: "h-12", 1: "h-24" } as const;
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
  4: ["top-0", "top-6", "top-12", "top-18"],
  3: ["top-0", "top-8", "top-16"],
  2: ["top-0", "top-12"],
  1: ["top-0"],
} as const;
