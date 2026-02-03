import { cn } from "@/lib/utils";
import { IBlock } from "../calendar-day-grid/calendar-day-grid-webworker";
import { GridEventBlock } from "../calendar-day-grid/calendar-day-grid-event-block";
import { Fragment, ReactNode, ButtonHTMLAttributes, forwardRef, memo, useCallback, useMemo } from "react";
import { useSharedEventDrawer } from "../../event-drawer/shared-event-drawer-context";
import { CalendarPermissions } from "../permissions/calendar.permissions";
import { TIME_BLOCK_SIZE } from "@/lib/types";
import { useCalendarViewport } from "./calendar-scroll-context";
import { PublicEventBlock } from "../view-public/calendar-public-view-event-block";
import { Skeleton } from "@/components/ui/skeleton";

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
  renderEventBlock: (p: EventBlockRenderProps) => ReactNode;
};

export type EventBlockRenderProps = {
  eventBlock: IBlock;
  heightInPixels: number;
  userId: string | undefined;
};

export function CalendarScrollColumnPrivate(
  props: Omit<CalendarScrollColumnProps, "renderTimeBlock" | "renderEventBlock">,
) {
  const { can, isVerifying } = CalendarPermissions.usePermissions();
  const allowed = !isVerifying && can("CreateEvent");

  const renderEventBlock = useCallback(
    ({ eventBlock, userId }: EventBlockRenderProps) => (
      <GridEventBlock eventBlock={eventBlock} heightInPixels={eventBlock.eventHeight} userId={userId} />
    ),
    [],
  );

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

  return <CalendarScrollColumnBase {...props} renderTimeBlock={renderTimeBlock} renderEventBlock={renderEventBlock} />;
}

export function CalendarScrollColumnPublic(
  props: Omit<CalendarScrollColumnProps, "renderTimeBlock" | "renderEventBlock">,
) {
  const viewportRef = useCalendarViewport();

  const renderEventBlock = useCallback(
    ({ eventBlock, userId }: EventBlockRenderProps) => (
      <PublicEventBlock eventBlock={eventBlock} heightInPixels={eventBlock.eventHeight} viewportRef={viewportRef} />
    ),
    [viewportRef],
  );

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

  return <CalendarScrollColumnBase {...props} renderTimeBlock={renderTimeBlock} renderEventBlock={renderEventBlock} />;
}

export function CalendarScrollColumnSkeleton(
  props: Omit<CalendarScrollColumnProps, "renderTimeBlock" | "renderEventBlock">,
) {
  const viewportRef = useCalendarViewport();

  const renderEventBlock = useCallback(({ eventBlock, userId }: EventBlockRenderProps) => <></>, [viewportRef]);

  const renderTimeBlock = useCallback(
    ({ totalBlocks, blockIndex, showBottomSeparator, hour, startMinute }: TimeBlockRenderProps) => (
      <div key={hour} className={cn("relative")} style={{ height: `${TIME_BLOCK_SIZE}px` }}>
        {blockIndex !== 0 && <div className="pointer-events-none absolute inset-x-0 top-0 border-b"></div>}
        <Skeleton className="absolute inset-x-0 top-[2px] h-[44px] transition-colors hover:bg-accent rounded-none"></Skeleton>

        <div className="pointer-events-none absolute inset-x-0 top-1/2 border-b border-dashed border-1"></div>

        <Skeleton className="absolute inset-x-0 top-[52px] h-[42px] transition-colors rounded-none"></Skeleton>
      </div>
    ),
    [],
  );

  return <CalendarScrollColumnBase {...props} renderTimeBlock={renderTimeBlock} renderEventBlock={renderEventBlock} />;
}

const CalendarScrollColumnBase = memo(function CalendarScrollColumnBase({
  loadingBlocks,
  title,
  interval,
  hours,
  roomId,
  userId,
  eventBlocks,
  isLastColumn,
  currentDate,
  renderTimeBlock,
  renderEventBlock,
}: CalendarScrollColumnProps) {
  const validInterval = clampToValidInterval(interval);
  const totalBlocks = 60 / validInterval;
  const middleBlock = useMemo(() => Math.max(0, Math.floor(totalBlocks / 2) - 1), [totalBlocks]);

  return (
    <div className={cn("min-w-45 w-full border-b-2", isLastColumn && "border-r-2")}>
      <div className="sticky top-0 z-5 bg-background border-b-2 h-8 flex items-center justify-center">
        <span className="ml-1 text-xs font-semibold text-foreground">{title}</span>
      </div>
      <div className="relative border-t-6 border-b-16">
        {hours?.map((hour, index) => {
          return (
            <div
              key={hour}
              className="grid w-full h-24 relative"
              style={{
                gridTemplateRows: `repeat(${totalBlocks}, 1fr)`,
                contentVisibility: "auto",
                containIntrinsicSize: `auto ${TIME_BLOCK_SIZE}px`,
              }}
            >
              {index !== 0 && <div className="pointer-events-none absolute inset-x-0 top-0 border-b-2"></div>}
              {Array.from({ length: totalBlocks }, (_, blockIndex) => {
                const startMinute = blockIndex * validInterval;
                const showBottomSeparator = blockIndex === middleBlock;
                return (
                  <Fragment key={`${hour}-${blockIndex}`}>
                    {renderTimeBlock({
                      roomId,
                      userId,
                      hour,
                      startMinute,
                      currentDate,
                      totalBlocks,
                      blockIndex,
                      showBottomSeparator,
                    })}
                  </Fragment>
                );
              })}
            </div>
          );
        })}

        {!loadingBlocks &&
          eventBlocks.map((block) => {
            return (
              <div
                key={`event-${block.event.eventId}-start-${new Date(block.event.startDate).getTime()}`}
                className="absolute p-1"
                style={block.eventStyle}
              >
                {renderEventBlock({ eventBlock: block, heightInPixels: block.eventHeight, userId })}
              </div>
            );
          })}
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

const TimeBlockButton = memo(
  forwardRef<
    HTMLButtonElement,
    ButtonHTMLAttributes<HTMLButtonElement> & { totalBlocks: number; blockIndex: number; showBottomSeparator?: boolean }
  >(function TimeBlockButton({ totalBlocks, blockIndex, showBottomSeparator, disabled, className, ...props }, ref) {
    return (
      <button
        ref={ref}
        type="button"
        disabled={disabled}
        className={cn(
          "w-full h-full transition-colors relative",
          disabled ? "cursor-default pointer-events-none" : "cursor-pointer hover:bg-accent",

          showBottomSeparator && "border-b border-dashed",
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
