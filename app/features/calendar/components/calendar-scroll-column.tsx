import { cn } from "@/lib/utils";

import { GridEventBlock } from "./calendar-scroll-private-event-block";
import { Fragment, ReactNode, ButtonHTMLAttributes, forwardRef, memo, useCallback, useMemo } from "react";

import { TIME_BLOCK_SIZE } from "@/lib/types";
import { useCalendarViewport } from "./calendar-scroll-context";
import { PublicEventBlock } from "./calendar-scroll-public-event-block";
import { Skeleton } from "@/components/ui/skeleton";
import { IEventBlock } from "../webworkers/generic-webworker";
import { CalendarPermissions } from "../permissions/calendar.permissions";
import { useSharedEventDrawer } from "../../event-drawer-refactor/shared-event-drawer-context";

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
  eventBlocks: IEventBlock[];
  isLastColumn: boolean;
  currentDate: Date;
  renderTimeBlock: (p: TimeBlockRenderProps) => ReactNode;
  renderEventBlock: (p: EventBlockRenderProps) => ReactNode;
};

export type EventBlockRenderProps = {
  eventBlock: IEventBlock;
  heightInPixels: number;
  userId: string | undefined;
};

export function CalendarScrollColumnPrivate(
  props: Omit<CalendarScrollColumnProps, "renderTimeBlock" | "renderEventBlock">,
) {
  const { can, canAny } = CalendarPermissions.usePermissions();

  const { openEventDrawer } = useSharedEventDrawer();

  const renderEventBlock = useCallback(
    ({ eventBlock, userId }: EventBlockRenderProps) => (
      <GridEventBlock
        eventBlock={eventBlock}
        heightInPixels={eventBlock.eventHeight}
        userId={userId}
        onClick={(e) => {
          e.preventDefault();
          const canReadEvent = canAny("ReadAllEvent", ["ReadSelfEvent", String(eventBlock.event.userId) === userId]);

          if (canReadEvent) {
            openEventDrawer({ event: eventBlock.event, userId });
          }
        }}
      />
    ),
    [openEventDrawer, canAny],
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
        createEventAllowed={can("CreateEvent")}
      />
    ),
    [can],
  );

  return <CalendarScrollColumnBase {...props} renderTimeBlock={renderTimeBlock} renderEventBlock={renderEventBlock} />;
}

export function CalendarScrollColumnPublic(
  props: Omit<CalendarScrollColumnProps, "renderTimeBlock" | "renderEventBlock">,
) {
  const { viewport, popoverLayer } = useCalendarViewport();

  const renderEventBlock = useCallback(
    ({ eventBlock, userId }: EventBlockRenderProps) => (
      <PublicEventBlock
        eventBlock={eventBlock}
        heightInPixels={eventBlock.eventHeight}
        viewport={viewport}
        popoverLayer={popoverLayer}
      />
    ),
    [viewport, popoverLayer],
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
  //
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
              className={cn(
                "grid w-full h-24 relative",
                index !== 0 && "border-t-2 ",
                "after:pointer-events-none after:absolute after:inset-x-0 after:top-1/2 after:h-[1px]",
                "after:bg-[linear-gradient(to_right,theme(colors.border)_50%,transparent_50%)] after:bg-[length:8px_1px] after:bg-repeat-x",
              )}
              style={{
                gridTemplateRows: `repeat(${totalBlocks}, 1fr)`,

                contentVisibility: "auto",
                containIntrinsicSize: `auto ${TIME_BLOCK_SIZE}px`,
              }}
            >
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
                      showBottomSeparator: false,
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
