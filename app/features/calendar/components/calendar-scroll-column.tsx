import { cn } from '@/lib/utils';

import { GridEventBlock } from './calendar-scroll-private-event-block-old';
import { Fragment, ReactNode, ButtonHTMLAttributes, forwardRef, memo, useCallback, useMemo } from 'react';

import { TIME_BLOCK_SIZE } from '@/lib/types';
import { useCalendarViewport } from './calendar-scroll-context';
import { PublicEventBlock } from './calendar-scroll-public-event-block';
import { Skeleton } from '@/components/ui/skeleton';
import { IEventBlock } from '../webworkers/generic-webworker';
import { CalendarPermissions } from '../permissions/calendar.permissions';
import { useSharedEventDrawer } from '../../event-drawer/drawer-context';
import { addDays } from 'date-fns';
import { LucideLock, LucideShieldBan } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { PrivateEventBlock } from './calendar-scroll-private-event-block';

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
  lockDay: boolean;
  lockHour: boolean;
};

export type CalendarScrollColumnProps = {
  loadingBlocks: boolean;
  title: string;
  interval: number;
  roomId: number | undefined;
  userId: string | undefined;
  limitToHours: boolean;
  limitToSpan: boolean;
  hours: number[];
  minHour: number;
  maxHour: number;
  maxSpan: number;
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
  props: Omit<CalendarScrollColumnProps, 'renderTimeBlock' | 'renderEventBlock' | 'limitToHours' | 'limitToSpan'>,
) {
  const { viewport, popoverLayer } = useCalendarViewport();
  const { can, canAny } = CalendarPermissions.usePermissions();

  const { openEventDrawer } = useSharedEventDrawer();
  const roomId = props.roomId;

  const renderEventBlock = useCallback(
    ({ eventBlock, userId }: EventBlockRenderProps) => (
      <PrivateEventBlock
        onClick={(e) => {
          e.preventDefault();
          const canReadEvent = canAny('ReadAllEvent', ['ReadSelfEvent', String(eventBlock.event.userId) === userId]);

          if (canReadEvent) {
            openEventDrawer({
              creationDate: new Date(eventBlock.event.startDate),
              event: eventBlock.event,
              userId,
              roomId,
            });
          }
        }}
        eventBlock={eventBlock}
        heightInPixels={eventBlock.eventHeight}
        viewport={viewport}
        popoverLayer={popoverLayer}
      />
    ),
    [canAny, openEventDrawer, popoverLayer, roomId, viewport],
  );
  /*
  <GridEventBlock
        eventBlock={eventBlock}
        heightInPixels={eventBlock.eventHeight}
        userId={userId}
        onClick={(e) => {
          e.preventDefault();
          const canReadEvent = canAny('ReadAllEvent', ['ReadSelfEvent', String(eventBlock.event.userId) === userId]);

          if (canReadEvent) {
            openEventDrawer({
              creationDate: new Date(eventBlock.event.startDate),
              event: eventBlock.event,
              userId,
              roomId,
            });
          }
        }}
      />
  */

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
        createEventAllowed={can('CreateEvent')}
        lockDay={p.lockDay}
        lockHour={p.lockHour}
      />
    ),
    [can],
  );

  return (
    <CalendarScrollColumnBase
      {...props}
      renderTimeBlock={renderTimeBlock}
      renderEventBlock={renderEventBlock}
      minHour={props.minHour}
      maxHour={props.maxHour}
      maxSpan={props.maxSpan}
      limitToHours={!can('IgnoreHours')}
      limitToSpan={!can('IgnoreBookingSpan')}
    />
  );
}

export function CalendarScrollColumnPublic(props: Omit<CalendarScrollColumnProps, 'renderTimeBlock' | 'renderEventBlock'>) {
  const { viewport, popoverLayer } = useCalendarViewport();

  const renderEventBlock = useCallback(
    ({ eventBlock }: EventBlockRenderProps) => (
      <PublicEventBlock eventBlock={eventBlock} heightInPixels={eventBlock.eventHeight} viewport={viewport} popoverLayer={popoverLayer} />
    ),
    [viewport, popoverLayer],
  );

  const renderTimeBlock = useCallback(
    ({ totalBlocks, blockIndex, hour, startMinute }: TimeBlockRenderProps) => (
      <TimeBlockButton
        totalBlocks={totalBlocks}
        blockIndex={blockIndex}
        disabled={true}
        aria-label={`Time slot ${hour}:${String(startMinute).padStart(2, '0')}`}
        isReadOnly={true}
      />
    ),
    [],
  );

  return (
    <CalendarScrollColumnBase
      {...props}
      renderTimeBlock={renderTimeBlock}
      renderEventBlock={renderEventBlock}
      minHour={props.minHour}
      maxHour={props.maxHour}
      maxSpan={props.maxSpan}
      limitToHours={false}
      limitToSpan={false}
    />
  );
}

const CalendarScrollColumnBase = memo(function CalendarScrollColumnBase({
  loadingBlocks,
  title,
  interval,
  hours,
  limitToHours,
  limitToSpan,
  minHour,
  maxHour,
  maxSpan,
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

  const lockDay = limitToSpan && currentDate.getTime() > addDays(new Date(), maxSpan).getTime();

  //
  return (
    <div className={cn('min-w-45 w-full border-b-2', isLastColumn && 'border-r-2')}>
      <div className="sticky top-0 z-5 bg-background border-b-2 h-8 flex items-center justify-center border-r">
        <span className="ml-1 text-xs font-semibold text-foreground">{title}</span>
      </div>
      <div className="relative border-t-6 border-b-16">
        {hours?.map((hour, index) => {
          const creationDate = getDateTime(currentDate, hour, 0);
          const lockHour = limitToHours && (creationDate.getHours() > maxHour || creationDate.getHours() < minHour);

          return (
            <div
              key={hour}
              className={cn(
                'grid w-full h-24 relative group',
                index !== 0 && 'border-t-2 ',
                'after:pointer-events-none after:absolute after:inset-x-0 after:top-1/2 after:h-px',
                'after:bg-[linear-gradient(to_right,var(--color-border)_50%,transparent_50%)] after:bg-size-[8px_1px] after:bg-repeat-x',
                'border-r',
              )}
              style={{
                gridTemplateRows: `repeat(${totalBlocks}, 1fr)`,

                contentVisibility: 'auto',
                containIntrinsicSize: `auto ${TIME_BLOCK_SIZE}px`,
              }}
            >
              {lockHour && (
                <div className="absolute inset-0 flex items-center justify-center overflow-hidden z-5">
                  <Tooltip delayDuration={1000} disableHoverableContent>
                    <TooltipTrigger asChild>
                      <div className="w-full h-full flex items-center justify-center cursor-not-allowed pointer-events-auto">
                        <LucideShieldBan
                          strokeWidth={1}
                          className="w-full h-full p-6 text-red-300/30 dark:text-red-300/20 opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity duration-500"
                        />
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>{'Permission Required to Book Outside of Working Hours'}</TooltipContent>
                  </Tooltip>
                </div>
              )}

              {Array.from({ length: totalBlocks }, (_, blockIndex) => {
                const startMinute = blockIndex * validInterval;

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
                      lockDay,
                      lockHour,
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
                key={`event-${block.event.eventId}-start-${new Date(block.event.startDate).getTime()}-room-${block.event.roomId}`}
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
  lockDay,
  lockHour,
}: {
  currentDate: Date;
  hour: number;
  startMinute: number;
  totalBlocks: number;
  userId: string | undefined;
  roomId: number | undefined;
  blockIndex: number;
  createEventAllowed: boolean;
  lockDay: boolean;
  lockHour: boolean;
}) {
  const creationDate = useMemo(() => getDateTime(currentDate, hour, startMinute), [currentDate, hour, startMinute]);
  const { openEventDrawer } = useSharedEventDrawer();

  const isDisabled = !createEventAllowed || lockDay || lockHour;

  const openDrawer = useCallback(() => {
    if (isDisabled) return;

    openEventDrawer({ creationDate, userId, roomId });
  }, [isDisabled, openEventDrawer, creationDate, userId, roomId]);

  return (
    <TimeBlockButton
      totalBlocks={totalBlocks}
      blockIndex={blockIndex}
      disabled={isDisabled}
      isReadOnly={false}
      onClick={openDrawer}
      aria-label={`Create event at ${hour}:${String(startMinute).padStart(2, '0')}`}
    />
  );
});

const TimeBlockButton = memo(
  forwardRef<
    HTMLButtonElement,
    ButtonHTMLAttributes<HTMLButtonElement> & {
      totalBlocks: number;
      blockIndex: number;

      isReadOnly: boolean;
    }
  >(function TimeBlockButton({ totalBlocks, blockIndex, disabled, isReadOnly, className, ...props }, ref) {
    return (
      <button
        ref={ref}
        type="button"
        disabled={disabled}
        className={cn(
          'w-full h-full transition-colors relative group flex items-center justify-center',

          disabled && !isReadOnly && 'cursor-not-allowed ',
          !isReadOnly && 'cursor-pointer hover:bg-accent',

          className,
        )}
        {...props}
      ></button>
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
  return VALID_INTERVALS.reduce((best, v) => (Math.abs(bounded - v) < Math.abs(bounded - best) ? v : best), VALID_INTERVALS[0]);
}
