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
import { CalendarAction, IRequestGroup } from '../webworkers/generic-webworker';
import { useEventPatchMutation } from '@/lib/services/events';
import { sharedColorVariants } from '@/lib/theme/colorVariants';
import { cva } from 'class-variance-authority';
import { EventCard } from './event-card';
import { IEventSingleRoom } from '@/lib/schemas';
import { useVirtualizer, useWindowVirtualizer } from '@tanstack/react-virtual';
import { useGridColumns } from './use-grid-columns';
import { TStatusKey } from '@/lib/types';

const SECTION_HEADER_PX = 40;
const GROUP_HEADER_PX = 40;
const HEADER_PX = SECTION_HEADER_PX + GROUP_HEADER_PX;

export function CalendarUserRequestView({ action, date, userId }: { action: CalendarAction; date: Date; userId?: string }) {
  const [removingEventIds, setRemovingEventIds] = useState<Set<number>>(() => new Set());

  const [collapsedKeys, setCollapsedKeys] = useState<Set<string>>(() => new Set());
  const collapseTimersRef = useRef<Map<string, number>>(new Map());

  const {
    visibleHours,
    selectedRoomIds,
    selectedStatusKeys,
    setSelectedStatusKeys,
    setIsHeaderLoading,
    setTotalEvents,
    statusIdLookupByKey,
    statusKeyLookupById,
  } = usePrivateCalendar();

  const groupIdRef = useRef<string | null>(null);

  const parentRef = useRef<HTMLDivElement>(null);
  const { columns } = useGridColumns(parentRef);

  const clampedColumn = Math.max(1, columns || 1);

  const prevColsRef = useRef(clampedColumn);

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
    | { type: 'SECTION_HEADER'; key: string; data: string; isRemoving: boolean }
    | { type: 'GROUP_HEADER'; key: string; data: IRequestGroup; isRemoving: boolean }
    | { type: 'EVENT_ROW'; key: string; data: IEventSingleRoom[] };

  // Helper to chunk the events

  const removingGroupIds = useMemo(() => {
    const ids = new Set<string>();

    result?.data?.requestSections?.forEach((section) => {
      section.sectionGroups.forEach((group) => {
        const allEventsRemoving = group.groupEvents.length > 0 && group.groupEvents.every((e) => removingEventIds.has(e.eventId));

        if (allEventsRemoving) {
          ids.add(group.groupId);
        }
      });
    });

    return ids;
  }, [result?.data?.requestSections, removingEventIds]);

  const removingSectionIds = useMemo(() => {
    const ids = new Set<string>();

    result?.data?.requestSections?.forEach((section) => {
      if (section.sectionGroups.length === 0) return;

      const allGroupsRemoving = section.sectionGroups.every((group) => removingGroupIds.has(group.groupId));

      if (allGroupsRemoving) {
        ids.add(section.sectionTitle);
      }
    });

    return ids;
  }, [result?.data?.requestSections, removingGroupIds]);

  const flatData = useMemo(() => {
    const list: VirtualRowItem[] = [];

    result?.data?.requestSections?.forEach((section, sectionIndex) => {
      const isRemovingSection = removingSectionIds.has(section.sectionTitle);

      const hasAnyVisibleGroup = section.sectionGroups.some((group) => {
        const hasVisibleEvents = group.groupEvents.some(
          (e) => selectedStatusKeys.includes(e.status.key as TStatusKey) || removingEventIds.has(e.eventId),
        );

        return hasVisibleEvents || removingGroupIds.has(group.groupId);
      });

      if (!hasAnyVisibleGroup && !isRemovingSection) return;

      list.push({
        type: 'SECTION_HEADER',
        key: `section:${sectionIndex}:${section.sectionTitle}`,
        data: section.sectionTitle,
        isRemoving: isRemovingSection,
      });

      section.sectionGroups.forEach((group) => {
        const visibleEvents = group.groupEvents.filter(
          (event) => selectedStatusKeys.includes(event.status.key as TStatusKey) || removingEventIds.has(event.eventId),
        );

        const isRemovingGroup = removingGroupIds.has(group.groupId);

        if (visibleEvents.length === 0 && !isRemovingGroup) return;

        list.push({ type: 'GROUP_HEADER', key: `group:${sectionIndex}:${group.groupId}`, data: group, isRemoving: isRemovingGroup });

        // Chunk the events into rows
        const eventRows = chunkArray(visibleEvents, clampedColumn);
        eventRows.forEach((rowEvents, rowIndex) => {
          list.push({ type: 'EVENT_ROW', key: `events:${sectionIndex}:${group.groupId}:${rowIndex}`, data: rowEvents });
        });
      });
    });
    return list;
  }, [result?.data?.requestSections, removingSectionIds, removingGroupIds, clampedColumn, selectedStatusKeys, removingEventIds]);

  const isRemovingItem = useCallback(
    (item: VirtualRowItem) => {
      if (item.type === 'EVENT_ROW') {
        return item.data.length > 0 && item.data.every((e) => removingEventIds.has(e.eventId));
      }
      // headers already carry isRemoving
      return item.isRemoving === true;
    },
    [removingEventIds],
  );

  const itemByKey = useMemo(() => new Map(flatData.map((i) => [i.key, i] as const)), [flatData]);

  useEffect(() => {
    const timers = collapseTimersRef.current;

    // 1) Schedule collapse for items that are removing but not yet collapsed
    for (const item of flatData) {
      if (!isRemovingItem(item)) continue;

      const k = item.key;
      if (collapsedKeys.has(k) || timers.has(k)) continue;

      const duration = item.type === 'EVENT_ROW' ? 200 : 300; // match your CSS: cards 200ms, headers 300ms

      const t = window.setTimeout(() => {
        setCollapsedKeys((prev) => {
          if (prev.has(k)) return prev;
          const next = new Set(prev);
          next.add(k);
          return next;
        });
        timers.delete(k);
      }, duration);

      timers.set(k, t);
    }

    // 2) Cancel scheduled collapses + uncollapse if item is no longer removing
    for (const [k, t] of timers) {
      const item = itemByKey.get(k);
      if (!item || !isRemovingItem(item)) {
        clearTimeout(t);
        timers.delete(k);
      }
    }

    // 3) Drop collapsed keys that no longer exist or are no longer removing
    setCollapsedKeys((prev) => {
      let changed = false;
      const next = new Set(prev);

      for (const k of prev) {
        const item = itemByKey.get(k);
        if (!item || !isRemovingItem(item)) {
          next.delete(k);
          changed = true;
        }
      }

      return changed ? next : prev;
    });
  }, [flatData, isRemovingItem, collapsedKeys, itemByKey]);

  const rowVirtualizer = useVirtualizer({
    count: flatData.length,
    getScrollElement: () => parentRef.current,
    estimateSize: useCallback(
      (index: number) => {
        const item = flatData[index];

        if (collapsedKeys.has(item.key)) return 0;

        if (item.type === 'SECTION_HEADER') return SECTION_HEADER_PX;
        if (item.type === 'GROUP_HEADER') return GROUP_HEADER_PX;
        return 600;
      },
      [collapsedKeys, flatData],
    ),

    measureElement: (el) => {
      // 1. Cast to HTMLElement
      const index = Number(el.getAttribute('data-index'));
      const item = flatData[index];

      if (!item) return 0;

      if (collapsedKeys.has(item.key)) return 0;

      if (item?.type === 'SECTION_HEADER') return SECTION_HEADER_PX;
      if (item?.type === 'GROUP_HEADER') return GROUP_HEADER_PX;

      // 3. Measure event rows normally
      return el.getBoundingClientRect().height;
    },
    overscan: 5,
    scrollPaddingStart: SECTION_HEADER_PX,
    getItemKey: (index) => flatData[index]?.key ?? index,
  });

  const virtualItems = rowVirtualizer.getVirtualItems();

  const scrollOffset = rowVirtualizer.scrollOffset || 0;

  const stickyInfo = useMemo(() => {
    // Find the item currently at the top of the viewport
    const top = scrollOffset + HEADER_PX + 1;

    const activeItem = [...virtualItems].reverse().find((v) => v.start <= top) ?? virtualItems[0];

    if (!activeItem) return { section: null, group: null, groupId: null };

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

    return { section: activeSection, group: activeGroup, groupId: activeGroup?.groupId ?? null };
  }, [scrollOffset, virtualItems, flatData]);

  useLayoutEffect(() => {
    const isColumnTransition = prevColsRef.current !== clampedColumn;
    if (isColumnTransition) return;

    groupIdRef.current = stickyInfo.groupId;
  }, [clampedColumn, stickyInfo.groupId]);

  useLayoutEffect(() => {
    if (collapsedKeys.size === 0) return;
    rowVirtualizer.measure();
  }, [collapsedKeys, rowVirtualizer]);

  useLayoutEffect(() => {
    if (!parentRef.current) return;
    if (prevColsRef.current === clampedColumn) return;
    prevColsRef.current = clampedColumn;

    const groupId = groupIdRef.current;
    if (!groupId) return;

    const newIndex = flatData.findIndex((item) => item.type === 'GROUP_HEADER' && item.data.groupId === groupId);

    if (newIndex === -1) return;

    // Reset measurements only when columns changed
    rowVirtualizer.measure(); // resets cached sizes [1](https://tanstack.dev/virtual/latest/docs/api/virtualizer)

    // Scroll after measurement has a chance to apply
    requestAnimationFrame(() => {
      rowVirtualizer.scrollToIndex(newIndex, { align: 'start', behavior: 'auto' });
    });
  }, [clampedColumn, flatData, rowVirtualizer]);

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
      setRemovingEventIds((prev) => new Set(prev).add(id));
      patchEvent.mutate({ data: { eventId: id, statusId: statusIdLookupByKey('APPROVED') } });
    },
    [patchEvent, statusIdLookupByKey],
  );

  const handleDeny = useCallback(
    (id: number) => {
      setRemovingEventIds((prev) => new Set(prev).add(id));
      patchEvent.mutate({ data: { eventId: id, statusId: statusIdLookupByKey('REJECTED') } });
    },
    [patchEvent, statusIdLookupByKey],
  );

  const handlePending = useCallback(
    (id: number) => {
      setRemovingEventIds((prev) => new Set(prev).add(id));
      patchEvent.mutate({ data: { eventId: id, statusId: statusIdLookupByKey('PENDING') } });
    },
    [patchEvent, statusIdLookupByKey],
  );

  useEffect(() => {
    if (removingEventIds.size === 0) return;

    const stillPresent = new Set<number>();

    result?.data?.requestSections?.forEach((section) => {
      section.sectionGroups.forEach((group) => {
        group.groupEvents.forEach((event) => {
          if (removingEventIds.has(event.eventId)) {
            stillPresent.add(event.eventId);
          }
        });
      });
    });

    // Only clear IDs that the server has removed
    if (stillPresent.size !== removingEventIds.size) {
      setRemovingEventIds(stillPresent);
    }
  }, [result?.data?.requestSections, removingEventIds]);

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

                  {item.type === 'EVENT_ROW' && (
                    <div
                      className={cn(
                        'overflow-hidden transition-[height,opacity] duration-300 ease-in-out',
                        item.data.every((e) => removingEventIds.has(e.eventId)) && 'opacity-0',
                      )}
                    >
                      <div
                        className="grid gap-4 p-4 w-full items-stretch"
                        style={{ gridTemplateColumns: `repeat(${clampedColumn}, minmax(0, 1fr))` }}
                      >
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
