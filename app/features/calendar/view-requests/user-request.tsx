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

const SECTION_HEADER_PX = 40;
const GROUP_HEADER_PX = 40;
const HEADER_PX = SECTION_HEADER_PX + GROUP_HEADER_PX;

export function CalendarUserRequestView({ action, date, userId }: { action: CalendarAction; date: Date; userId?: string }) {
  const [removingEvents, setRemovingEvents] = useState<Map<number, TStatusKey>>(() => new Map());

  const removingEventIds = useMemo(() => new Set(removingEvents.keys()), [removingEvents]);

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

  const groupKeyRef = useRef<string | null>(null);

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
      setTotalEvents(result.totalEvents);
    }
  }, [isLoading, result, setIsHeaderLoading, setTotalEvents]);

  const isEmpty = false;
  const isMounting = false;

  type VirtualRowItem =
    | { type: 'SECTION_HEADER'; key: string; data: string; isRemoving: boolean }
    | { type: 'GROUP_HEADER'; key: string; data: IRequestGroup; isRemoving: boolean }
    | { type: 'GROUP_ROW'; key: string; data: IEventSingleRoom[] };

  const removingGroupIds = useMemo(() => {
    const ids = new Set<string>();

    result?.data?.requestSections?.forEach((section) => {
      section.sectionGroups.forEach((group) => {
        const allEventsWillBeHidden = group.groupEvents.every((e) => {
          const targetStatus = removingEvents.get(e.eventId);
          const currentStatusVisible = selectedStatusKeys.includes(e.status.key as TStatusKey);

          if (removingEvents.has(e.eventId)) {
            return !selectedStatusKeys.includes(targetStatus!);
          }
          return !currentStatusVisible;
        });

        if (group.groupEvents.length > 0 && allEventsWillBeHidden) {
          ids.add(group.groupKey);
        }
      });
    });
    return ids;
  }, [result?.data?.requestSections, removingEvents, selectedStatusKeys]);

  const removingSectionIds = useMemo(() => {
    const ids = new Set<string>();

    result?.data?.requestSections?.forEach((section) => {
      if (section.sectionGroups.length === 0) return;

      const allGroupsRemoving = section.sectionGroups.every((group) => removingGroupIds.has(group.groupKey));

      if (allGroupsRemoving) {
        ids.add(section.sectionTitle);
      }
    });

    return ids;
  }, [result?.data?.requestSections, removingGroupIds]);

  const flatData = useMemo(() => {
    const list: VirtualRowItem[] = [];

    result?.data?.requestSections?.forEach((section) => {
      const isRemovingSection = removingSectionIds.has(section.sectionTitle);

      const hasAnyVisibleGroup = section.sectionGroups.some((group) => {
        const hasVisibleEvents = group.groupEvents.some(
          (e) => selectedStatusKeys.includes(e.status.key as TStatusKey) || removingEventIds.has(e.eventId),
        );

        return hasVisibleEvents || removingGroupIds.has(group.groupKey);
      });

      if (!hasAnyVisibleGroup && !isRemovingSection) return;

      list.push({
        type: 'SECTION_HEADER',
        key: section.sectionKey,
        data: section.sectionTitle,
        isRemoving: isRemovingSection,
      });

      section.sectionGroups.forEach((group) => {
        const visibleEvents = group.groupEvents.filter((event) => {
          const isCurrentVisible = selectedStatusKeys.includes(event.status.key as TStatusKey);
          const targetStatus = removingEvents.get(event.eventId);
          const isTargetVisible = targetStatus ? selectedStatusKeys.includes(targetStatus) : false;

          return isCurrentVisible || isTargetVisible;
        });
        const isRemovingGroup = removingGroupIds.has(group.groupKey);

        if (visibleEvents.length === 0 && !isRemovingGroup) return;

        list.push({ type: 'GROUP_HEADER', key: group.groupKey, data: group, isRemoving: isRemovingGroup });

        // Chunk the events into rows
        const eventRows = chunkArray<IEventSingleRoom>(visibleEvents, clampedColumn);
        eventRows.forEach((eventRow) => {
          list.push({ type: 'GROUP_ROW', key: `${group.groupKey}:events[${eventRow.map((e) => e.eventId).join('-')}]`, data: eventRow });
        });
      });
    });
    return list;
  }, [result?.data?.requestSections, removingSectionIds, removingGroupIds, selectedStatusKeys, removingEventIds, clampedColumn, removingEvents]);

  type ScrollAnchor = {
    key: string;
    index: number;
    offsetWithinItem: number;
  };

  const latestFlatDataRef = useRef(flatData);
  useEffect(() => {
    latestFlatDataRef.current = flatData;
  }, [flatData]);

  const liveAnchorRef = useRef<ScrollAnchor | null>(null);
  const pendingRestoreRef = useRef<ScrollAnchor | null>(null);

  const isRemovingItem = useCallback(
    (item: VirtualRowItem) => {
      if (item.type === 'GROUP_ROW') {
        return (
          item.data.length > 0 &&
          item.data.every((e) => {
            const targetStatus = removingEvents.get(e.eventId);
            // Only mark as removing if it's actually leaving the filter
            return targetStatus && !selectedStatusKeys.includes(targetStatus);
          })
        );
      }
      return item.isRemoving === true;
    },
    [removingEvents, selectedStatusKeys],
  );

  const itemByKey = useMemo(() => new Map(flatData.map((i) => [i.key, i] as const)), [flatData]);

  useEffect(() => {
    const timers = collapseTimersRef.current;

    // Schedule collapse for items that are removing but not yet collapsed
    for (const item of flatData) {
      if (!isRemovingItem(item)) continue;

      const k = item.key;
      if (collapsedKeys.has(k) || timers.has(k)) continue;

      const duration = item.type === 'GROUP_ROW' ? 200 : 300; // match CSS

      const t = window.setTimeout(() => {
        // capture anchor right before collapsing height to 0
        pendingRestoreRef.current = liveAnchorRef.current;

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

    // Cancel removal if item is no longer removing
    for (const [k, t] of timers) {
      const item = itemByKey.get(k);
      if (!item || !isRemovingItem(item)) {
        clearTimeout(t);
        timers.delete(k);
      }
    }

    // Drop collapsed keys that no longer exist or are no longer removing
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

  const rowVirtualizer = useVirtualizer<HTMLDivElement, HTMLDivElement>({
    count: flatData.length,
    getScrollElement: () => parentRef.current,

    estimateSize: useCallback(
      (index: number) => {
        const item = flatData[index];

        if (item.type === 'SECTION_HEADER') return SECTION_HEADER_PX;
        if (item.type === 'GROUP_HEADER') return GROUP_HEADER_PX;
        return 628;
      },
      [flatData],
    ),

    measureElement: (el) => {
      const index = Number(el.getAttribute('data-index'));
      const item = flatData[index];

      if (!item) return 0;

      return el.getBoundingClientRect().height;
    },
    overscan: 5,
    scrollPaddingStart: SECTION_HEADER_PX,
    getItemKey: (index) => flatData[index]?.key ?? index,
  });

  // Inside your component
  const [isRestoring, setIsRestoring] = useState(false);
  const anchorRef = useRef<{ key: string; offset: number } | null>(null);

  // This function finds the first visible item and saves how far it is from the top
  const captureAnchor = useCallback(() => {
    const virtualItems = rowVirtualizer.getVirtualItems();
    if (virtualItems.length === 0) return;

    // We find the first item that is actually visible (or the first in the virtual list)
    const anchorItem = virtualItems[0];
    const scrollElement = parentRef.current;

    if (anchorItem && scrollElement) {
      // Distance from the top of the container to the top of the item
      const itemTop = anchorItem.start;
      const containerScroll = scrollElement.scrollTop;

      anchorRef.current = {
        key: anchorItem.key as string,
        offset: containerScroll - itemTop, // How many pixels of this item are scrolled past
      };
    }
  }, [rowVirtualizer]);

  const virtualItems = rowVirtualizer.getVirtualItems();

  const scrollOffset = rowVirtualizer.scrollOffset || 0;

  const stickyInfo = useMemo(() => {
    const top = scrollOffset + HEADER_PX + 1;

    const activeItem = [...virtualItems].reverse().find((v) => v.start <= top) ?? virtualItems[0];

    if (!activeItem) return { section: null, group: null, groupId: null };

    let activeSection: string | null = null;
    let activeGroup: IRequestGroup | null = null;

    // Search backwards to find the current Group and Section
    for (let i = activeItem.index; i >= 0; i--) {
      const item = flatData[i];

      if (!activeGroup && item.type === 'GROUP_HEADER') {
        activeGroup = item.data;
      }

      if (item.type === 'SECTION_HEADER') {
        activeSection = item.data;

        if (!activeGroup) {
          // Look forward slightly to find the immediate group if we are at the start
          const nextItem = flatData[i + 1];
          if (nextItem?.type === 'GROUP_HEADER') {
            activeGroup = nextItem.data;
          }
        }
        break;
      }
    }

    return { section: activeSection, group: activeGroup, groupId: activeGroup?.groupKey ?? null };
  }, [scrollOffset, virtualItems, flatData]);

  useLayoutEffect(() => {
    const isColumnTransition = prevColsRef.current !== clampedColumn;
    if (isColumnTransition) return;

    groupKeyRef.current = stickyInfo.groupId;
  }, [clampedColumn, stickyInfo.groupId]);

  useLayoutEffect(() => {
    if (!parentRef.current) return;
    if (prevColsRef.current === clampedColumn) return;
    prevColsRef.current = clampedColumn;

    const groupKey = groupKeyRef.current;
    if (!groupKey) return;

    const newIndex = flatData.findIndex((item) => item.type === 'GROUP_HEADER' && item.data.groupKey === groupKey);

    if (newIndex === -1) return;

    // Reset measurements when columns changed
    rowVirtualizer.measure();

    // Scroll after measurement has a chance to apply
    requestAnimationFrame(() => {
      rowVirtualizer.scrollToIndex(newIndex, { align: 'start', behavior: 'auto' });
    });
  }, [clampedColumn, flatData, rowVirtualizer]);

  useLayoutEffect(() => {
    if (anchorRef.current && parentRef.current) {
      const { key, offset } = anchorRef.current;

      // Find where our anchor item is in the NEW list
      const newItems = rowVirtualizer.getVirtualItems();
      const foundItem = newItems.find((item) => item.key === key);

      if (foundItem) {
        const newScrollTop = foundItem.start + offset;
        parentRef.current.scrollTop = newScrollTop;
      }

      // Clear the anchor so it doesn't interfere with normal scrolling
      anchorRef.current = null;
    }
  }, [flatData, rowVirtualizer]);

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
    [captureAnchor, patchEvent, statusIdLookupByKey],
  );

  const handleDeny = useCallback(
    (id: number) => {
      captureAnchor();
      setRemovingEvents((prev) => new Map(prev).set(id, 'REJECTED'));
      patchEvent.mutate({ data: { eventId: id, statusId: statusIdLookupByKey('REJECTED') } });
    },
    [captureAnchor, patchEvent, statusIdLookupByKey],
  );

  const handlePending = useCallback(
    (id: number) => {
      captureAnchor();
      setRemovingEvents((prev) => new Map(prev).set(id, 'PENDING'));
      patchEvent.mutate({ data: { eventId: id, statusId: statusIdLookupByKey('PENDING') } });
    },
    [captureAnchor, patchEvent, statusIdLookupByKey],
  );

  useEffect(() => {
    if (removingEvents.size === 0) return;

    const currentServerStatuses = new Map<number, TStatusKey>();
    result?.data?.requestSections?.forEach((s) =>
      s.sectionGroups.forEach((g) => g.groupEvents.forEach((e) => currentServerStatuses.set(e.eventId, e.status.key as TStatusKey))),
    );

    const nextRemovingEvents = new Map(removingEvents);
    let changed = false;

    removingEvents.forEach((targetStatus, id) => {
      const serverStatus = currentServerStatuses.get(id);

      if (!serverStatus || serverStatus === targetStatus) {
        nextRemovingEvents.delete(id);
        changed = true;
      }
    });

    if (changed) {
      setRemovingEvents(nextRemovingEvents);
    }
  }, [result?.data?.requestSections, removingEvents]);

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
