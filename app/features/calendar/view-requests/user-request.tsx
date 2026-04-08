'use client';
import { usePrivateCalendar } from '@/contexts/CalendarProviderPrivate';

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef } from 'react';

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
import { TStatusKey } from '@/lib/types';

export function CalendarUserRequestView({ action, date, userId }: { action: CalendarAction; date: Date; userId?: string }) {
  const { visibleHours, selectedRoomIds, selectedStatusKeys, setSelectedStatusKeys, setIsHeaderLoading, setTotalEvents, statusLookup } =
    usePrivateCalendar();

  const groupIdRef = useRef<string | null>(null);

  const parentRef = useRef<HTMLDivElement>(null);
  const { columns } = useGridColumns(parentRef);

  useEffect(() => {
    setSelectedStatusKeys(['PENDING']);
  }, [setSelectedStatusKeys]);

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

  const rowVirtualizer = useVirtualizer({
    count: flatData.length,
    getScrollElement: () => parentRef.current,
    estimateSize: useCallback(
      (index: number) => {
        const item = flatData[index];
        if (item.type === 'SECTION_HEADER') return 40;
        if (item.type === 'GROUP_HEADER') return 43;
        return 600;
      },
      [flatData],
    ),

    measureElement: (el) => {
      // 1. Cast to HTMLElement
      const index = Number(el.getAttribute('data-index'));
      const item = flatData[index];

      if (item?.type === 'SECTION_HEADER') return 40;
      if (item?.type === 'GROUP_HEADER') return 43;

      // 3. Measure event rows normally
      return el.getBoundingClientRect().height;
    },
    overscan: 5,
  });

  const virtualItems = rowVirtualizer.getVirtualItems();

  const scrollOffset = rowVirtualizer.scrollOffset || 0;

  const stickyInfo = useMemo(() => {
    // Find the item currently at the top of the viewport
    const activeItem = virtualItems.find((item) => {
      return scrollOffset >= item.start && scrollOffset < item.start + item.size;
    });

    if (!activeItem) return { section: null, group: null };

    let activeSection: string | null = null;
    let activeGroup: IRequestGroup | null = null;

    // Search backwards to find the current context
    for (let i = activeItem.index; i >= 0; i--) {
      const item = flatData[i];

      if (!activeGroup && item.type === 'GROUP_HEADER') {
        activeGroup = item.data;
      }

      if (item.type === 'SECTION_HEADER') {
        activeSection = item.data;

        if (!activeGroup) {
          // Look forward slightly to find the immediate group if we are at the section start
          const nextItem = flatData[i + 1];
          if (nextItem?.type === 'GROUP_HEADER') {
            activeGroup = nextItem.data;
          }
        }
        break;
      }
    }

    return { section: activeSection, group: activeGroup };
  }, [scrollOffset, virtualItems, flatData]);

  useEffect(() => {
    if (stickyInfo.group) {
      groupIdRef.current = stickyInfo.group.groupId;
    }
  }, [stickyInfo.group]);

  useLayoutEffect(() => {
    rowVirtualizer.measure();

    const groupId = groupIdRef.current;
    if (!groupId) return;

    const newIndex = flatData.findIndex((item) => {
      if (item.type === 'GROUP_HEADER') return item.data.groupId === groupId;
      return false;
    });

    if (newIndex !== -1) {
      requestAnimationFrame(() => {
        rowVirtualizer.scrollToIndex(newIndex, {
          align: 'start',
          behavior: 'auto',
        });
      });
    }
  }, [columns, flatData, rowVirtualizer]);

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
    (id: number) => patchEvent.mutate({ data: { eventId: id, statusId: statusLookup('APPROVED') } }),
    [patchEvent, statusLookup],
  );

  const handleDeny = useCallback(
    (id: number) => {
      patchEvent.mutate({ data: { eventId: id, statusId: statusLookup('REJECTED') } });
    },
    [patchEvent, statusLookup],
  );

  const handlePending = useCallback(
    (id: number) => {
      patchEvent.mutate({ data: { eventId: id, statusId: statusLookup('PENDING') } });
    },
    [patchEvent, statusLookup],
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
        <ScrollArea className="w-full flex-1 min-h-0" type="always" viewportRef={parentRef}>
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
                    <div className="bg-accent text-primary p-2 border-b-2 border-accent/50 h-10 flex items-center">
                      <span className="text-md font-bold">{item.data}</span>
                    </div>
                  )}

                  {item.type === 'GROUP_HEADER' && (
                    <div className={cn('p-2 h-10 border-b-2 flex items-center border-t', badgeVariants({ color: item.data.groupColor }))}>
                      <span className="text-md">{item.data.groupName}</span>
                    </div>
                  )}

                  {item.type === 'EVENT_ROW' && (
                    <div className="grid gap-4 p-4 w-full items-stretch" style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}>
                      {item.data.map((event: IEventSingleRoom) => (
                        <EventCard
                          key={event.eventId}
                          event={event}
                          index={virtualRow.index}
                          OnPending={handlePending}
                          OnApprove={handleApprove}
                          OnDeny={handleDeny}
                        />
                      ))}
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
