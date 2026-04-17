'use client';

import { format } from 'date-fns';
import { useEffect, useRef, useState } from 'react';

import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { cva } from 'class-variance-authority';
import { sharedColorVariants, sharedTextVariants } from '@/lib/theme/colorVariants';
import { useScrollPopoverDirection } from './use-scroll-popover-direction';

import { TColors, TStatusKey } from '@/lib/types';
import { IEventBlock } from '../webworkers/generic-webworker';
import { IEventSingleRoom } from '@/lib/schemas';

import { BadgeColored } from '@/components/ui/badge-colored';
import { Calendar, Clock, LucideDoorClosed, LucideDoorOpen, SendHorizonal, User } from 'lucide-react';
import DynamicIcon, { IconName } from '@/components/ui/icon-dynamic';
import { CalendarPermissions } from '../permissions/calendar.permissions';

type Props = {
  viewport: HTMLDivElement | null;
  popoverLayer: HTMLDivElement | null;
  eventBlock: IEventBlock;
  heightInPixels: number;
  onClick: (e: React.MouseEvent) => void;
};

const CLOSE_ALL_POPOVERS = 'calendar-private-close-all-tooltips';

const HOVER_OPEN_DELAY = 500;
const HOVER_CLOSE_DELAY = 100;

export const EventCard = cva(
  'flex select-none flex-col gap-0.5 truncate whitespace-nowrap rounded-md border px-1.5 py-0.5 text-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring',
  {
    variants: { color: sharedColorVariants },
    defaultVariants: { color: 'blue' },
  },
);

export function PrivateEventBlock({ viewport, popoverLayer, eventBlock, heightInPixels, onClick }: Props) {
  const { can } = CalendarPermissions.usePermissions();

  const [popoverIsOpen, setPopoverOpen] = useState(false);

  const triggerRef = useRef<HTMLButtonElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  /** Suppresses hover/focus re-open after click */
  const suppressNextOpenRef = useRef(false);

  const openTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const closeTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const lastInteractionWasKeyboardRef = useRef(false);

  const side = useScrollPopoverDirection({
    open: popoverIsOpen,
    triggerRef,
    contentRef,
    viewport,
    sideOffset: 10,
    collisionPadding: { top: 38, bottom: 10, left: 10, right: 10 },
    preferOrder: ['right', 'left', 'bottom', 'top'],
  });

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Tab') {
        lastInteractionWasKeyboardRef.current = true;
      }
    };

    const onPointerDown = () => {
      lastInteractionWasKeyboardRef.current = false;
    };

    window.addEventListener('keydown', onKeyDown, true);
    window.addEventListener('pointerdown', onPointerDown, true);

    return () => {
      window.removeEventListener('keydown', onKeyDown, true);
      window.removeEventListener('pointerdown', onPointerDown, true);
    };
  }, []);

  if (!eventBlock?.event || !viewport || !popoverLayer) return null;

  const clearOpenTimer = () => {
    if (openTimeoutRef.current) {
      clearTimeout(openTimeoutRef.current);
      openTimeoutRef.current = null;
    }
  };

  const clearCloseTimer = () => {
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }
  };

  const handleMouseEnter = () => {
    if (suppressNextOpenRef.current) return;

    clearCloseTimer();

    if (!popoverIsOpen) {
      clearOpenTimer();
      openTimeoutRef.current = setTimeout(() => {
        setPopoverOpen(true);
        openTimeoutRef.current = null;
      }, HOVER_OPEN_DELAY);
    }
  };

  const handleMouseLeave = () => {
    suppressNextOpenRef.current = false;

    clearOpenTimer();
    clearCloseTimer();

    closeTimeoutRef.current = setTimeout(() => {
      setPopoverOpen(false);
      if (document.activeElement === triggerRef.current) {
        triggerRef.current?.blur();
      }
      closeTimeoutRef.current = null;
    }, HOVER_CLOSE_DELAY);
  };

  const handleInternalClick = (e: React.MouseEvent) => {
    suppressNextOpenRef.current = true;

    clearOpenTimer();
    clearCloseTimer();
    setPopoverOpen(false);

    onClick(e);
  };

  const scrollIntoViewIfNeeded = (element: HTMLElement) => {
    if (!viewport) return;

    const containerRect = viewport.getBoundingClientRect();
    const elementRect = element.getBoundingClientRect();
    const offset = 40;

    const isVisible = elementRect.top >= containerRect.top + offset && elementRect.bottom <= containerRect.bottom;

    if (isVisible) return;

    const relativeTop = elementRect.top - containerRect.top;

    viewport.scrollBy({
      top: relativeTop - offset,
      behavior: 'smooth',
    });
  };

  const handleFocus = (e: React.FocusEvent<HTMLButtonElement>) => {
    if (suppressNextOpenRef.current) return;
    if (!lastInteractionWasKeyboardRef.current) return;

    scrollIntoViewIfNeeded(e.currentTarget);
    handleMouseEnter(); // reuse tooltip open logic
  };

  const isApproved = eventBlock.event.status.key === ('APPROVED' as TStatusKey);

  const color: TColors = isApproved ? (eventBlock.event.roomColor as TColors) : 'disabled';

  const timeRange = getTimeRangeLabel(eventBlock.event);

  const showEventType = eventBlock.event.multiDay || eventBlock.event.recurrence;

  const eventType = eventBlock.event.recurrence ? 'Series/Recurring' : eventBlock.event.multiDay?.description;

  const textVariants = cva('', {
    variants: {
      color: sharedTextVariants,
    },
    defaultVariants: {
      color: 'slate',
    },
  });

  const ReadAll = can('ReadAllEvent');

  return (
    <Popover open={popoverIsOpen} onOpenChange={setPopoverOpen}>
      <div className="w-full" onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave} onClick={handleInternalClick} onBlur={handleMouseLeave}>
        <PopoverTrigger asChild>
          <button
            ref={triggerRef}
            type="button"
            aria-label={`${isApproved ? 'Booked' : 'Requested'} from ${timeRange}, ${eventBlock.event.title}, in ${eventBlock.event.roomName}`}
            className={cn(EventCard({ color }), 'w-full overflow-hidden text-left outline-none focus-visible:ring-2 ring-ring ring-offset-2')}
            style={{ height: `${heightInPixels}px` }}
            onFocus={handleFocus}
          >
            <div className="flex flex-col gap-1">
              <p className="truncate font-semibold">{eventBlock.event.title}</p>
              {showEventType && (
                <p className="truncate">
                  {eventBlock.event.recurrence ? 'Series/Recurring' : eventBlock.event.multiDay ? eventBlock.event.multiDay.description : ''}
                </p>
              )}
              <p className="truncate">{timeRange}</p>
            </div>
          </button>
        </PopoverTrigger>
      </div>

      <PopoverContent
        ref={contentRef}
        container={popoverLayer}
        collisionBoundary={viewport}
        side={side}
        align="start"
        sideOffset={10}
        sticky="always"
        collisionPadding={{ top: 38, bottom: 10, left: 10, right: 10 }}
        avoidCollisions
        onOpenAutoFocus={(e) => e.preventDefault()}
        onCloseAutoFocus={(e) => e.preventDefault()}
        role="tooltip"
        aria-hidden="true"
        className="z-5 pointer-events-none w-fit min-w-64 max-w-96 p-3 shadow-xl"
      >
        <div className="space-y-1">
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <DynamicIcon color={eventBlock.event.status.color as TColors} name={eventBlock.event.status.icon as IconName} className="size-3.5" />
            <span className={cn(textVariants({ color: eventBlock.event.status.color as TColors }), 'text-xs')}>{eventBlock.event.status.name}</span>
          </div>
          <div className="flex flex-col  gap-1 border-b pb-1 mb-1 border-muted-foreground">
            <div className="flex items-center gap-1">
              <p className="text-sm text-foreground font-medium">{eventBlock.event.title}</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <LucideDoorOpen className="size-3.5" />
            <span className="text-sm text-primary/80">{eventBlock.event.roomName}</span>
          </div>

          {showEventType && (
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Calendar className="size-3.5" />
              <span className="text-sm text-primary/80">{eventType}</span>
            </div>
          )}

          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Clock className="size-3.5" />
            <span className="text-sm text-primary/80">{timeRange}</span>
          </div>
          {ReadAll && (
            <>
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <User className="size-3.5" />
                <span className="text-sm text-primary/80">{eventBlock.event.userName}</span>
              </div>

              <div className="flex flex-col gap-1">
                <span className="border-b border-dashed"></span>
                <div className="flex flex-col">
                  <div className="flex flex-row justify-between">
                    <span className="text-xxs ">Created By: </span>
                    <span className="text-xxs">{eventBlock.event.createdBy}</span>
                  </div>
                  <div className="flex flex-row justify-between">
                    <span className="text-xxs ">Created On: </span>
                    <span className="text-xxs">{format(eventBlock.event.createdAt, 'PPP @ p')}</span>
                  </div>
                </div>
                <span className="border-b border-dashed"></span>
                <div className="flex flex-col">
                  <div className="flex flex-row justify-between">
                    <span className="text-xxs ">Modified By: </span>
                    <span className="text-xxs">{eventBlock.event.updatedBy}</span>
                  </div>
                  <div className="flex flex-row justify-between">
                    <span className="text-xxs ">Modified On: </span>
                    <span className="text-xxs">{format(eventBlock.event.updatedAt, 'PPP @ p')}</span>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

const getTimeRangeLabel = (event: IEventSingleRoom) => {
  const { multiDay, startDate, endDate } = event;
  const start = format(startDate, 'h:mm a');
  const end = format(endDate, 'h:mm a');

  if (!multiDay) return `${start} - ${end}`;

  switch (multiDay.position) {
    case 'first':
      return `${start} - 12:00 AM`;
    case 'middle':
    case 'single':
      return 'All Day';
    case 'last':
      return `12:00 AM - ${end}`;
    default:
      return `${start} - ${end}`;
  }
};
