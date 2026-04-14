'use client';
import { usePrivateCalendar } from '@/contexts/CalendarProviderPrivate';

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';

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
import { CalendarAction, IRequestGroup, IRequestSection } from '../webworkers/generic-webworker';
import { useEventPatchMutation } from '@/lib/services/events';
import { sharedColorVariants } from '@/lib/theme/colorVariants';
import { cva } from 'class-variance-authority';
import { EventCard } from './event-card';
import { IEventSingleRoom } from '@/lib/schemas';
import { useVirtualizer, useWindowVirtualizer, VirtualItem, Virtualizer } from '@tanstack/react-virtual';
import { useGridColumns } from './use-grid-columns';
import { TStatusKey } from '@/lib/types';
import { useCalendarEventData } from './useCalendarEventData';
import { useCalendarVirtualization } from './useCalendarVirtualization';
import { useCalendarScrollAnchoring } from './useCalendarScrollAnchoring';

const SECTION_HEADER_PX = 40;
const GROUP_HEADER_PX = 40;
const HEADER_PX = SECTION_HEADER_PX + GROUP_HEADER_PX;

export type VirtualRowItem =
  | { type: 'SECTION_HEADER'; key: string; data: string; isRemoving: boolean }
  | { type: 'GROUP_HEADER'; key: string; data: IRequestGroup; isRemoving: boolean }
  | { type: 'GROUP_ROW'; key: string; data: IEventSingleRoom[] };

export function CalendarUserRequestView({ action, date, userId }: { action: CalendarAction; date: Date; userId?: string }) {
  const parentRef = useRef<HTMLDivElement>(null);
  const { columns } = useGridColumns(parentRef);

  const {
    result,
    isLoading,
    error,
    removingEvents,
    setRemovingEvents,
    removingEventIds,
    removingGroupIds,
    removingSectionIds,
    selectedStatusKeys,
    statusIdLookupByKey,
  } = useCalendarEventData(action, date, userId);

  const { flatData, rowVirtualizer, collapsedKeys, isRemovingItem } = useCalendarVirtualization({
    requestSections: result?.data?.requestSections,
    overscanSize: action === 'YEAR' ? 100 : 15,
    clampedColumn: columns,
    removingEvents,
    removingEventIds,
    removingGroupIds,
    removingSectionIds,
    selectedStatusKeys,
    parentRef,
  });

  const { captureAnchor, stickyInfo } = useCalendarScrollAnchoring({
    rowVirtualizer,
    flatData,
    clampedColumn: columns,
    parentRef,
    isRemovingItem,
  });

  const virtualItems = rowVirtualizer.getVirtualItems();

  const badgeVariants = cva('', {
    variants: {
      color: sharedColorVariants,
    },
    defaultVariants: {
      color: 'slate',
    },
  });

  const patchEvent = useEventPatchMutation();

  const handleApprove = useCallback(
    (id: number) => {
      captureAnchor();
      setRemovingEvents((prev) => new Map(prev).set(id, 'APPROVED'));
      patchEvent.mutate({ data: { eventId: id, statusId: statusIdLookupByKey('APPROVED') } });
    },
    [captureAnchor, patchEvent, setRemovingEvents, statusIdLookupByKey],
  );

  const handleDeny = useCallback(
    (id: number) => {
      captureAnchor();
      setRemovingEvents((prev) => new Map(prev).set(id, 'REJECTED'));
      patchEvent.mutate({ data: { eventId: id, statusId: statusIdLookupByKey('REJECTED') } });
    },
    [captureAnchor, patchEvent, setRemovingEvents, statusIdLookupByKey],
  );

  const handlePending = useCallback(
    (id: number) => {
      captureAnchor();
      setRemovingEvents((prev) => new Map(prev).set(id, 'PENDING'));
      patchEvent.mutate({ data: { eventId: id, statusId: statusIdLookupByKey('PENDING') } });
    },
    [captureAnchor, patchEvent, setRemovingEvents, statusIdLookupByKey],
  );

  return (
    <div className="flex flex-1 min-h-0 relative">
      <div className="absolute top-0 left-0 right-0 z-30 pointer-events-none h-20">
        {stickyInfo.section && (
          <div className="bg-accent text-primary p-2 border-b-2 border-accent/50 shadow-sm h-10 pointer-events-auto flex items-center">
            {stickyInfo.section}
          </div>
        )}
        {stickyInfo.group && (
          <div
            className={cn(
              'p-2 shadow-sm h-10 border-b-2 pointer-events-auto flex items-center transition-colors border-t',
              badgeVariants({ color: stickyInfo.group.groupColor }),
            )}
          >
            {stickyInfo.group.groupName}
          </div>
        )}
      </div>
      <div className="flex flex-col min-h-0 min-w-0 flex-1">
        <ScrollArea className="w-full flex-1 min-h-0" type="always" viewportRef={parentRef} viewportClassName="[overflow-anchor:none]">
          <div
            //key={`virtual-container-cols-${columns}`}
            style={{
              height: `${rowVirtualizer.getTotalSize()}px`,
              width: '100%',
              position: 'relative',
            }}
          >
            {virtualItems.map((virtualRow) => {
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
                    <div
                      className={cn(
                        'overflow-hidden transition-[height,opacity,transform] duration-300 ease-in-out',
                        item.isRemoving && 'opacity-0 -translate-y-2',
                      )}
                    >
                      <div className="bg-accent text-primary p-2 border-b-2 border-accent/50 h-10 flex items-center">{item.data}</div>
                    </div>
                  )}

                  {item.type === 'GROUP_HEADER' && (
                    <div
                      className={cn(
                        'overflow-hidden transition-[height,opacity,transform] duration-300 ease-in-out',
                        item.isRemoving && 'opacity-0 -translate-y-1',
                      )}
                    >
                      <div className={cn('p-2 h-10 border-b-2 flex items-center border-t', badgeVariants({ color: item.data.groupColor }))}>
                        <span className="text-md">{item.data.groupName}</span>
                      </div>
                    </div>
                  )}

                  {item.type === 'GROUP_ROW' && (
                    <div
                      className={cn(
                        'overflow-hidden transition-[height,opacity] duration-300 ease-in-out',
                        item.data.every((e) => removingEventIds.has(e.eventId)) && 'opacity-0',
                      )}
                    >
                      <div className="grid gap-4 p-4 w-full items-stretch" style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}>
                        {item.data.map((event: IEventSingleRoom) => {
                          const isRemoving = removingEventIds.has(event.eventId);

                          return (
                            <div
                              key={event.eventId}
                              className={cn('transition-[opacity,transform] duration-200 ease-out', isRemoving && 'opacity-0 scale-95')}
                            >
                              <EventCard
                                event={event}
                                index={virtualRow.index}
                                OnPending={handlePending}
                                OnApprove={handleApprove}
                                OnDeny={handleDeny}
                              />
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          <ScrollBar orientation="vertical" className="z-50" />
        </ScrollArea>
      </div>
    </div>
  );
}

function chunkArray<T>(arr: T[], size: number): T[][] {
  return Array.from({ length: Math.ceil(arr.length / size) }, (_, i) => arr.slice(i * size, i * size + size));
}
