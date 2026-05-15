'use client';
import { usePrivateCalendar } from '@/contexts/CalendarProviderPrivate';

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';

import { cn } from '@/lib/utils';

import { usePrivateCalendarEvents } from '../webworkers/use-calendar-private-events';

import { LucideDoorOpen, LucidePartyPopper } from 'lucide-react';
import { GenericError } from '../../../../components/shared/generic-error';

import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { CalendarAction } from '../webworkers/generic-webworker';
import { useEventPatchMutation } from '@/lib/services/events';
import { sharedColorVariants } from '@/lib/theme/colorVariants';
import { cva } from 'class-variance-authority';
import { EventCard } from './event-card';
import { IEventSingleRoom } from '@/lib/schemas';
import { useVirtualizer } from '@tanstack/react-virtual';
import { useGridColumns } from './use-grid-columns';
import { TColors, TStatusKey } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';

const SECTION_HEADER_PX = 40;
const GROUP_HEADER_PX = 40;
const HEADER_PX = SECTION_HEADER_PX + GROUP_HEADER_PX;
const ROW_PX = 628;

export type VirtualRowItem =
  | {
      type: 'SECTION_HEADER';
      key: string;
      sectionKey: string;
      sectionName: string;
      groupKey: string | null;
      groupName: string | null;
      groupColor: TColors | null;
      totalEventCount: number;
    }
  | {
      type: 'GROUP_HEADER';
      key: string;
      sectionKey: string;
      sectionName: string;
      groupKey: string | null;
      groupName: string | null;
      groupColor: TColors | null;
      eventCount: number;
      rowCount: number;
    }
  | {
      type: 'GROUP_ROW';
      key: string;
      sectionKey: string;
      sectionName: string;
      groupKey: string | null;
      groupName: string | null;
      groupColor: TColors | null;
      rowIndex: number;
      data: IEventSingleRoom[];
    };

export function CalendarUserRequestView({ action, date, userId }: { action: CalendarAction; date: Date; userId?: string }) {
  const [removingEvents, setRemovingEvents] = useState<Map<number, TStatusKey>>(() => new Map());

  const removingEventIds = useMemo(() => new Set(removingEvents.keys()), [removingEvents]);

  const itemTypeRef = useRef<Array<'SECTION_HEADER' | 'GROUP_HEADER' | 'GROUP_ROW'>>([]);

  const { visibleHours, selectedRoomIds, selectedStatusKeys, setSelectedStatusKeys, setIsHeaderLoading, setTotalEvents, statusIdLookupByKey } =
    usePrivateCalendar();

  const groupKeyRef = useRef<string | null>(null);

  const { columns, setContainerRef, parentRef } = useGridColumns();

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

  const flatData = useMemo(() => {
    const list: VirtualRowItem[] = [];
    result?.data?.requestSections?.forEach((section) => {
      const sectionEvents = section.sectionGroups.flatMap((g) => g.groupEvents);

      const firstGroup = section.sectionGroups[0] || {};

      const group = {
        groupKey: firstGroup.groupKey || null,
        groupName: firstGroup.groupName || null,
        groupColor: firstGroup.groupColor || null,
      };

      list.push({
        type: 'SECTION_HEADER',
        key: section.sectionKey,
        sectionKey: section.sectionKey,
        sectionName: section.sectionTitle,
        groupKey: group.groupKey,
        groupName: group.groupName,
        groupColor: group.groupColor,
        totalEventCount: sectionEvents.length,
      });

      section.sectionGroups.forEach((group) => {
        const rowCount = Math.ceil(group.groupEvents.length / clampedColumn);

        list.push({
          type: 'GROUP_HEADER',
          key: group.groupKey,
          sectionKey: section.sectionKey,
          sectionName: section.sectionTitle,
          groupKey: group.groupKey,
          groupName: group.groupName,
          groupColor: group.groupColor,
          eventCount: group.groupEvents.length,
          rowCount,
        });

        const eventRows = chunkArray<IEventSingleRoom>(group.groupEvents, clampedColumn);
        eventRows.forEach((eventRow, rowIndex) => {
          list.push({
            type: 'GROUP_ROW',
            key: `${group.groupKey}:events[${rowIndex}]`,
            sectionKey: section.sectionKey,
            sectionName: section.sectionTitle,
            groupKey: group.groupKey,
            groupName: group.groupName,
            groupColor: group.groupColor,
            rowIndex,
            data: eventRow,
          });
        });
      });
    });
    return list;
  }, [result?.data?.requestSections, clampedColumn]);

  useEffect(() => {
    itemTypeRef.current = flatData.map((item) => item.type);
  }, [flatData]);

  const latestFlatDataRef = useRef(flatData);
  useEffect(() => {
    latestFlatDataRef.current = flatData;
  }, [flatData]);

  const rowVirtualizer = useVirtualizer<HTMLDivElement, HTMLDivElement>({
    count: flatData.length,
    getScrollElement: () => parentRef.current,

    estimateSize: useCallback((index: number) => {
      const type = itemTypeRef.current[index];

      if (type === 'SECTION_HEADER') return SECTION_HEADER_PX;
      if (type === 'GROUP_HEADER') return GROUP_HEADER_PX;
      return ROW_PX;
    }, []),
    overscan: 15,
    scrollPaddingStart: SECTION_HEADER_PX,
    getItemKey: (index) => flatData[index].key,
  });

  rowVirtualizer.shouldAdjustScrollPositionOnItemSizeChange = () => false;

  const anchorRef = useRef<{ key: string; offset: number } | null>(null);

  const virtualItems = rowVirtualizer.getVirtualItems();

  const itemMetaMap = useMemo(() => {
    const map = new Map<
      number,
      {
        sectionKey: string | null;
        sectionName: string | null;
        groupKey: string | null;
        groupName: string | null;
        groupColor: TColors | null;
      }
    >();

    let currentSection: VirtualRowItem | null = null;
    let currentGroup: VirtualRowItem | null = null;

    flatData.forEach((item, index) => {
      if (item.type === 'SECTION_HEADER') {
        currentSection = item;
        currentGroup = item; // Reset group when section changes
      } else if (item.type === 'GROUP_HEADER') {
        currentGroup = item;
      }

      map.set(index, {
        sectionKey: currentSection?.sectionKey ?? null,
        sectionName: currentSection?.sectionName ?? null,
        groupKey: currentGroup?.groupKey ?? null,
        groupName: currentGroup?.groupName ?? null,
        groupColor: currentGroup?.groupColor ?? null,
      });
    });

    return map;
  }, [flatData]);

  const scrollOffset = rowVirtualizer.scrollOffset || 0;

  const stickyInfo = useMemo(() => {
    if (virtualItems.length === 0) {
      return { sectionKey: null, sectionName: null, groupKey: null, groupName: null, groupColor: null };
    }

    // Define the threshold for when a header becomes "sticky"
    // (e.g., the item at the top of the viewport)
    const topThreshold = scrollOffset + HEADER_PX / 2;

    // Find the first virtual item that has passed the threshold
    // We use .find() on virtualItems which is usually a very small array (e.g., 10-20 items)
    const topItem = virtualItems.find((v) => v.start + v.size > topThreshold) || virtualItems[0];

    return (
      itemMetaMap.get(topItem.index) || {
        sectionKey: null,
        sectionName: null,
        groupKey: null,
        groupName: null,
        groupColor: null,
      }
    );
  }, [scrollOffset, virtualItems, itemMetaMap]);

  useLayoutEffect(() => {
    if (prevColsRef.current === clampedColumn) {
      groupKeyRef.current = stickyInfo.groupKey;
    }
  }, [clampedColumn, stickyInfo.groupKey]);

  useLayoutEffect(() => {
    if (!parentRef.current || prevColsRef.current === clampedColumn) return;
    prevColsRef.current = clampedColumn;
    const groupKey = groupKeyRef.current;
    if (!groupKey) return;

    const newIndex = flatData.findIndex((item) => item.type === 'GROUP_HEADER' && item.key === groupKey);
    if (newIndex === -1) return;

    requestAnimationFrame(() => {
      rowVirtualizer.scrollToIndex(newIndex, { align: 'start', behavior: 'auto' });
    });
  }, [clampedColumn, flatData, rowVirtualizer, parentRef]);

  useLayoutEffect(() => {
    if (anchorRef.current && parentRef.current && flatData.length > 0) {
      const { offset } = anchorRef.current;

      rowVirtualizer.scrollToOffset(offset);
    }
  }, [flatData, parentRef, rowVirtualizer]);

  const badgeVariants = cva('', {
    variants: {
      color: sharedColorVariants,
    },
    defaultVariants: {
      color: 'slate',
    },
  });

  const patchEvent = useEventPatchMutation();

  const handleStatusChange = useCallback(
    (id: number, newStatus: TStatusKey) => {
      if (!parentRef.current) return;

      // 1. Get current virtual items to find what's at the top
      const currentScroll = parentRef.current.scrollTop;
      const virtualItems = rowVirtualizer.getVirtualItems();
      if (virtualItems.length === 0 || !parentRef.current) return;

      const anchorItem = virtualItems.find((item) => item.start + item.size > currentScroll) || virtualItems[0];

      const nextRemovingEvents = new Map(removingEvents).set(id, newStatus);
      const shrinkage = getPendingShrinkage(flatData, nextRemovingEvents, newStatus, selectedStatusKeys, anchorItem.index, clampedColumn);

      // We subtract shrinkage because the list is about to get shorter
      anchorRef.current = {
        key: anchorItem.key as string,
        offset: currentScroll - shrinkage,
      };

      setRemovingEvents(nextRemovingEvents);
      patchEvent.mutate({
        data: { eventId: id, statusId: statusIdLookupByKey(newStatus) },
        statusKey: newStatus,
      });
    },
    [parentRef, rowVirtualizer, removingEvents, flatData, selectedStatusKeys, clampedColumn, patchEvent, statusIdLookupByKey],
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
    if (changed) setRemovingEvents(nextRemovingEvents);
  }, [result?.data?.requestSections, removingEvents]);

  if (error) {
    return <GenericError error={error} />;
  }

  if (isLoading) {
    return (
      <div className="flex flex-1 min-h-0 relative">
        <div className="flex flex-1 flex-col space-y-2">
          <div className="flex-1 flex flex-col">
            <Skeleton className="flex-1 w-full"></Skeleton>
          </div>
        </div>
      </div>
    );
  }

  const emptyState =
    selectedRoomIds.length === 0
      ? { title: 'No Room Selected', message: 'Please choose a room', icon: <LucideDoorOpen /> }
      : flatData.length === 0
        ? {
            title: 'No Events Found',
            message: "There don't appear to be events associated with this date",
            icon: <LucidePartyPopper />,
          }
        : null;

  if (emptyState) {
    return <EmptyMessage title={emptyState.title} message={emptyState.message} icon={emptyState.icon} />;
  }

  return (
    <div className="flex flex-1 min-h-0 relative">
      <div className="absolute top-0 left-0 right-0 z-30 pointer-events-none h-20">
        {stickyInfo.sectionKey && (
          <div className="bg-accent text-primary p-2 border-b-2 border-accent/50 shadow-sm h-10 pointer-events-auto flex items-center">
            {stickyInfo.sectionName}
          </div>
        )}
        {stickyInfo.groupName && (
          <div
            className={cn(
              'p-2 shadow-sm h-10 border-b-2 pointer-events-auto flex items-center transition-colors border-t',
              badgeVariants({ color: stickyInfo.groupColor }),
            )}
          >
            {stickyInfo.groupName}
          </div>
        )}
      </div>
      <div className="flex flex-col min-h-0 min-w-0 flex-1">
        <ScrollArea className="w-full flex-1 min-h-0" type="always" viewportRef={setContainerRef} viewportClassName="[overflow-anchor:none]">
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
                    <div className={cn('overflow-hidden ')}>
                      <div className="bg-accent text-primary p-2 border-b-2 border-accent/50 h-10 flex items-center">{item.sectionName}</div>
                    </div>
                  )}

                  {item.type === 'GROUP_HEADER' && (
                    <div className={cn('overflow-hidden ')}>
                      <div className={cn('p-2 h-10 border-b-2 flex items-center border-t', badgeVariants({ color: item.groupColor }))}>
                        <span className="text-md">{item.groupName}</span>
                      </div>
                    </div>
                  )}

                  {item.type === 'GROUP_ROW' && (
                    <div className={cn('overflow-hidden')}>
                      <div className="grid gap-4 p-4 w-full items-stretch" style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}>
                        {item.data.map((event: IEventSingleRoom) => {
                          const isRemoving = removingEventIds.has(event.eventId);

                          return (
                            <div key={event.eventId}>
                              <EventCard event={event} index={virtualRow.index} onStatusChange={handleStatusChange} isUpdating={isRemoving} />
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

function EmptyMessage({ title, message, icon }: { title: string; message: string; icon: React.ReactNode }) {
  return (
    <div className="flex flex-1 min-h-0 relative">
      <div className="flex flex-1 flex-col space-y-2">
        <div className="flex-1 flex flex-col">
          <div className="flex flex-1 flex-col  p-4">
            <Empty className="border border-dashed flex flex-1 flex-col items-center justify-center">
              <EmptyHeader>
                <EmptyMedia>{icon}</EmptyMedia>
                <EmptyTitle>{title}</EmptyTitle>
                <EmptyDescription>{message}</EmptyDescription>
              </EmptyHeader>
            </Empty>
          </div>
        </div>
      </div>
    </div>
  );
}

function chunkArray<T>(arr: T[], size: number): T[][] {
  return Array.from({ length: Math.ceil(arr.length / size) }, (_, i) => arr.slice(i * size, i * size + size));
}

function getPendingShrinkage(
  flatData: VirtualRowItem[],
  removingEvents: Map<number, TStatusKey>,
  newStatus: TStatusKey,
  selectedStatusKeys: TStatusKey[],
  topVisibleItemIndex: number,
  clampedColumn: number,
): number {
  // The event is changing to a visible status key
  // As a result it will not be removed so no calculations are required.
  if (selectedStatusKeys.includes(newStatus)) return 0;

  let totalShrinkage = 0;

  const removingIds = new Set<number>();
  removingEvents.forEach((status, id) => {
    if (!selectedStatusKeys.includes(status)) {
      removingIds.add(id);
    }
  });

  if (removingIds.size === 0) return 0;

  // 2. Map out counts of pending removals per group and section
  const groupRemovalCounts = new Map<string, number>();
  const sectionRemovalCounts = new Map<string, number>();
  const groupHeaderMap = new Map<string, Extract<VirtualRowItem, { type: 'GROUP_HEADER' }>>();

  // Scan full dataset to build context for counts
  for (const item of flatData) {
    if (item.type === 'GROUP_HEADER') {
      groupHeaderMap.set(item.key, item);
    }

    if (item.type === 'GROUP_ROW') {
      const gKey = item.groupKey;
      const sKey = item.sectionKey;

      item.data.forEach((event) => {
        if (removingIds.has(event.eventId)) {
          if (gKey) groupRemovalCounts.set(gKey, (groupRemovalCounts.get(gKey) || 0) + 1);
          if (sKey) sectionRemovalCounts.set(sKey, (sectionRemovalCounts.get(sKey) || 0) + 1);
        }
      });
    }
  }

  const processedGroups = new Set<string>();
  const processedSections = new Set<string>();

  for (let i = 0; i < topVisibleItemIndex; i++) {
    const item = flatData[i];

    // ========== GROUP SHRINK ==========
    if (item.type === 'GROUP_ROW') {
      const gKey = item.groupKey;
      if (!gKey || processedGroups.has(gKey)) continue;

      const removals = groupRemovalCounts.get(gKey) || 0;
      if (removals === 0) continue;

      const groupHeader = groupHeaderMap.get(gKey);
      if (!groupHeader) continue;

      processedGroups.add(gKey);

      // We know that Events needs to be removed from this group
      const newEventCount = Math.max(0, groupHeader.eventCount - removals);

      // Calculate whether removing the event changes the number of rows in the grou
      const newRowCount = Math.ceil(newEventCount / clampedColumn);

      // If rows collapse, each removed row contributes to total shrinkage
      if (newRowCount < groupHeader.rowCount) {
        totalShrinkage += (groupHeader.rowCount - newRowCount) * ROW_PX;
      }

      // If no events remain, the group header is removed from the layout
      if (newEventCount === 0) {
        totalShrinkage += GROUP_HEADER_PX;
      }
    }

    // ========== SECTION SHRINK ==========
    if (item.type === 'SECTION_HEADER') {
      const sKey = item.key;
      if (!sKey || processedSections.has(sKey)) continue;
      processedSections.add(sKey);

      const removals = sectionRemovalCounts.get(sKey) || 0;
      if (removals === 0) continue;

      processedSections.add(sKey);

      // Remove an event from the Section to see if it would also become empty
      const newSectionEventCount = item.totalEventCount - removals;

      // If the section becomes empty, its header is removed from the layout
      if (newSectionEventCount === 0) {
        totalShrinkage += SECTION_HEADER_PX;
      }
    }
  }

  return totalShrinkage;
}
