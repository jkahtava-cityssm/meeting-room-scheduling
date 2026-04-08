'use client';
import { usePrivateCalendar } from '@/contexts/CalendarProviderPrivate';

import { useEffect, useMemo, useRef } from 'react';

import { cn } from '@/lib/utils';
import { CalendarDayColumnCalendar } from '../sidebar-day-picker/calendar-day-column-calendar';

import { usePrivateCalendarEvents } from '../webworkers/use-calendar-private-events';
import { CalendarScrollContainerPrivate } from '../components/calendar-scroll-container';
import { CalendarScrollColumnPrivate } from '../components/calendar-scroll-column';

import { CalendarScrollContainerSkeleton } from '../components/calendar-scroll-container-skeleton';

import { LoaderCircle, LucideCalendarDays, Terminal } from 'lucide-react';
import { GenericError } from '../../../../components/shared/generic-error';

import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { CalendarAction, IRequestGroup } from '../webworkers/generic-webworker';
import { useEventPatchMutation } from '@/lib/services/events';
import { sharedColorVariants } from '@/lib/theme/colorVariants';
import { cva } from 'class-variance-authority';
import { EventCard } from './event-card';
import { IEventSingleRoom } from '@/lib/schemas';
import { useVirtualizer, useWindowVirtualizer } from '@tanstack/react-virtual';
import { useGridColumns } from './use-grid-columns';

export function CalendarUserRequestView({ action, date, userId }: { action: CalendarAction; date: Date; userId?: string }) {
  const {
    interval,
    maxSpan,
    visibleHours,
    fallbackHours,
    visibleRooms,
    selectedRoomIds,
    selectedStatusKeys,
    configurationError,
    roomError,
    setIsHeaderLoading,
    setTotalEvents,
    statusLookup,
  } = usePrivateCalendar();

  const roomIds = useMemo(() => (visibleRooms ? visibleRooms.map((room) => room.roomId.toString()) : []), [visibleRooms]);

  const { result, isLoading, error } = usePrivateCalendarEvents(
    action,
    date,
    visibleHours,
    userId,
    selectedRoomIds,
    selectedStatusKeys,
    true,
    'booking',
  );

  useEffect(() => {
    if (isLoading) {
      setIsHeaderLoading(true);
    }

    if (result && !isLoading) {
      setIsHeaderLoading(false);
    }
  }, [isLoading, result, setIsHeaderLoading, setTotalEvents]);

  const isEmpty = false;
  const isMounting = false;

  const columns = useGridColumns();

  type VirtualRowItem =
    | { type: 'SECTION_HEADER'; data: string }
    | { type: 'GROUP_HEADER'; data: IRequestGroup }
    | { type: 'EVENT_ROW'; data: IEventSingleRoom[] };

  // Helper to chunk the events

  const flatData = useMemo(() => {
    const list: VirtualRowItem[] = [];
    // Use a simple media query check or a hook like useBreakpoint()
    // For this example, let's assume 'columns' is 1 (mobile) or 3 (desktop)

    result?.data?.requestSections?.forEach((section) => {
      list.push({ type: 'SECTION_HEADER', data: section.sectionTitle });

      section.sectionGroups.forEach((group) => {
        list.push({ type: 'GROUP_HEADER', data: group });

        // Chunk the events into rows
        const eventRows = chunkArray(group.groupEvents, columns);
        eventRows.forEach((rowEvents) => {
          list.push({ type: 'EVENT_ROW', data: rowEvents });
        });
      });
    });
    return list;
  }, [result?.data?.requestSections, columns]);

  const parentRef = useRef<HTMLDivElement>(null);

  const rowVirtualizer = useVirtualizer({
    count: flatData.length,
    estimateSize: (index) => {
      const item = flatData[index];
      if (item.type === 'SECTION_HEADER') return 40;
      if (item.type === 'GROUP_HEADER') return 40;
      return 450; // Our EventCard height
    },
    getScrollElement: () => parentRef.current,
    measureElement: (el) => el.getBoundingClientRect().height,
    overscan: 5,
  });

  useEffect(() => {
    rowVirtualizer.measure();
  }, [columns, rowVirtualizer]);

  const badgeVariants = cva('', {
    variants: {
      color: sharedColorVariants,
    },
    defaultVariants: {
      color: 'slate',
    },
  });

  const patchEvent = useEventPatchMutation();

  return (
    <div className="flex flex-1 min-h-0">
      <div className="flex flex-col min-h-0 min-w-0 flex-1">
        <ScrollArea className="w-full flex-1 min-h-0" type="always" viewportRef={parentRef}>
          <div
            style={{
              height: `${rowVirtualizer.getTotalSize()}px`,
              width: '100%',
              position: 'relative',
            }}
          >
            {rowVirtualizer.getVirtualItems().map((virtualRow) => {
              const item = flatData[virtualRow.index];
              return (
                <div
                  key={virtualRow.key}
                  data-index={virtualRow.index}
                  ref={rowVirtualizer.measureElement}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    transform: `translateY(${virtualRow.start}px)`,
                  }}
                >
                  {item.type === 'SECTION_HEADER' && (
                    <div className="sticky top-0 bg-accent text-primary p-2 border-2 border-accent/50 shadow-sm h-10 z-20">
                      <span className="text-md font-bold">{item.data}</span>
                    </div>
                  )}

                  {item.type === 'GROUP_HEADER' && (
                    <div className={cn('sticky top-10 p-2 shadow-sm h-10 border-2 z-10', badgeVariants({ color: item.data.groupColor }))}>
                      <span className="text-md">{item.data.groupName}</span>
                    </div>
                  )}

                  {item.type === 'EVENT_ROW' && (
                    <div className={cn('grid gap-4 p-4 w-full', columns === 3 ? 'grid-cols-3' : columns === 2 ? 'grid-cols-2' : 'grid-cols-1')}>
                      {item.data.map((event: IEventSingleRoom) => (
                        <EventCard
                          key={event.eventId}
                          event={event}
                          index={virtualRow.index}
                          OnPending={() => patchEvent.mutate({ data: { eventId: event.eventId, statusId: statusLookup('PENDING') } })}
                          OnApprove={() => patchEvent.mutate({ data: { eventId: event.eventId, statusId: statusLookup('APPROVED') } })}
                          OnDeny={() => patchEvent.mutate({ data: { eventId: event.eventId, statusId: statusLookup('REJECTED') } })}
                        />
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          <ScrollBar orientation="vertical" />
        </ScrollArea>
      </div>
    </div>
  );
}

function chunkArray<T>(arr: T[], size: number): T[][] {
  return Array.from({ length: Math.ceil(arr.length / size) }, (_, i) => arr.slice(i * size, i * size + size));
}

function GroupSection({ requestGroup }: { requestGroup: IRequestGroup }) {
  const { statusLookup } = usePrivateCalendar();
  const patchEvent = useEventPatchMutation();

  const badgeVariants = cva('', {
    variants: {
      color: sharedColorVariants,
    },
    defaultVariants: {
      color: 'slate',
    },
  });

  return (
    <div className="w-full">
      <div className={cn('sticky top-10 p-2  shadow-sm h-10 border-2 rounded-b-sm', badgeVariants({ color: requestGroup.groupColor }))}>
        <span className={cn('flex-1 text-md')}> {requestGroup.groupName}</span>
      </div>
      <div className="flex flex-wrap gap-4 p-4 ">
        {requestGroup.groupEvents.map((event, idx) => {
          return (
            <EventCard
              key={String(event.eventId)}
              event={event}
              OnPending={() => {
                patchEvent.mutate({
                  data: { eventId: event.eventId, statusId: statusLookup('PENDING') },
                });
              }}
              OnApprove={() => {
                patchEvent.mutate({
                  data: { eventId: event.eventId, statusId: statusLookup('APPROVED') },
                });
              }}
              OnDeny={() => {
                patchEvent.mutate({
                  data: { eventId: event.eventId, statusId: statusLookup('REJECTED') },
                });
              }}
              index={0}
            ></EventCard>
          );
        })}
      </div>
    </div>
  );
}
