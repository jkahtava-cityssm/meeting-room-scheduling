import { cva } from 'class-variance-authority';
import { format } from 'date-fns';

import { TColors } from '@/lib/types';

import { sharedColorVariants } from '@/lib/theme/colorVariants';
import { IEventBlock } from '../webworkers/generic-webworker';
import { ButtonHTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/utils';
import { IEventSingleRoom } from '@/lib/schemas';

export const EventCard = cva(
  'flex select-none flex-col gap-0.5 truncate whitespace-nowrap rounded-md border px-1.5 py-0.5 text-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring',
  {
    variants: {
      color: sharedColorVariants,
    },
    defaultVariants: {
      color: 'blue',
    },
  },
);

interface MonthEventBadgeProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'color'> {
  eventBlock: IEventBlock;
  heightInPixels: number;

  userId?: string;
}

export const GridEventBlock = forwardRef<HTMLButtonElement, MonthEventBadgeProps>(function GridEventBlock(
  { eventBlock, heightInPixels, userId, ...buttonProps },
  ref,
) {
  if (!eventBlock?.event) {
    return;
  }
  const color = eventBlock.event.roomColor as TColors;

  const EventCardClasses = EventCard({ color });

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      if (e.currentTarget instanceof HTMLElement) e.currentTarget.click();
    }
  };

  return (
    <button
      type="button"
      ref={ref}
      tabIndex={0}
      className={cn('w-full h-full', EventCardClasses)}
      style={{
        height: `${heightInPixels}px`,
      }}
      onKeyDown={handleKeyDown}
      aria-label={buttonProps['aria-label'] ?? eventBlock.event.title}
      {...buttonProps}
    >
      <div className="flex  text-left flex-col gap-1">
        <p className="truncate font-semibold">{eventBlock.event.title}</p>
        <p className="truncate">{getTimeRangeLabel(eventBlock.event)}</p>
        <p className="mt-2 truncate">{eventBlock.event.recurrence ? 'Series' : eventBlock.event.multiDay ? 'Day 0' : ''}</p>
        <p className="truncate ">{eventBlock.event.status.name}</p>
      </div>
    </button>
  );
});

const getTimeRangeLabel = (event: IEventSingleRoom) => {
  const { multiDay, startDate, endDate } = event;
  const startStr = format(startDate, 'h:mm a');
  const endStr = format(endDate, 'h:mm a');

  if (!multiDay) return `${startStr} - ${endStr}`;

  switch (multiDay.position) {
    case 'first':
      return `${startStr} - 12:00 AM`;
    case 'middle':
    case 'single':
      return 'All Day';
    case 'last':
      return `12:00 AM - ${endStr}`;

    default:
      return `${startStr} - ${endStr}`;
  }
};
