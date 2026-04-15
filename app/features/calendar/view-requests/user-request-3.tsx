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
import { TColors, TStatusKey } from '@/lib/types';

const SECTION_HEADER_PX = 40;
const GROUP_HEADER_PX = 40;
const HEADER_PX = SECTION_HEADER_PX + GROUP_HEADER_PX;
const ROW_PX = 628;

export type VirtualRowItem =
  | { type: 'SECTION_HEADER'; key: string; sectionName: string; isRemoving: boolean }
  | { type: 'GROUP_HEADER'; key: string; groupName: string; groupColor: TColors; isRemoving: boolean }
  | { type: 'GROUP_ROW'; key: string; data: IEventSingleRoom[] };

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

  const flatData = useMemo(() => {
    const list: VirtualRowItem[] = [];
    result?.data?.requestSections?.forEach((section) => {
      list.push({
        type: 'SECTION_HEADER',
        key: section.sectionKey,
        sectionName: section.sectionTitle,
        isRemoving: false,
      });

      section.sectionGroups.forEach((group) => {
        list.push({
          type: 'GROUP_HEADER',
          key: group.groupKey,
          groupName: group.groupName,
          groupColor: group.groupColor,
          isRemoving: false,
        });

        const eventRows = chunkArray<IEventSingleRoom>(group.groupEvents, clampedColumn);
        eventRows.forEach((eventRow, rowIndex) => {
          list.push({ type: 'GROUP_ROW', key: `${group.groupKey}:events[${rowIndex}]`, data: eventRow });
        });
      });
    });
    return list;
  }, [result?.data?.requestSections, clampedColumn]);

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

  const rowVirtualizer = useVirtualizer<HTMLDivElement, HTMLDivElement>({
    count: flatData.length,
    getScrollElement: () => parentRef.current,

    estimateSize: useCallback(
      (index: number) => {
        const item = flatData[index];

        if (item.type === 'SECTION_HEADER') return SECTION_HEADER_PX;
        if (item.type === 'GROUP_HEADER') return GROUP_HEADER_PX;
        return ROW_PX;
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

  rowVirtualizer.shouldAdjustScrollPositionOnItemSizeChange = () => true;

  const anchorRef = useRef<{ key: string; offset: number } | null>(null);

  // This function finds the first visible item and saves how far it is from the top
  const captureAnchor = useCallback(
    (eventId: number, status: TStatusKey) => {
      const virtualItems = rowVirtualizer.getVirtualItems();
      if (virtualItems.length === 0 || !parentRef.current) return;

      const anchorItem = virtualItems.find((item) => item.start >= parentRef.current!.scrollTop) || virtualItems[0];

      anchorRef.current = {
        key: anchorItem.key as string,
        offset: parentRef.current.scrollTop - anchorItem.start,
      };
    },
    [rowVirtualizer],
  );

  const virtualItems = rowVirtualizer.getVirtualItems();

  const scrollOffset = rowVirtualizer.scrollOffset || 0;

  const stickyInfo = useMemo(() => {
    const top = scrollOffset + HEADER_PX + 1;
    const activeItem = [...virtualItems].reverse().find((v) => v.start <= top) ?? virtualItems[0];
    if (!activeItem) return { sectionKey: null, sectionName: null, groupKey: null, groupName: null, groupColor: null };

    let activeSectionKey: string | null = null;
    let activeSectionName: string | null = null;
    let activeGroupKey: string | null = null;
    let activeGroupName: string | null = null;
    let activeGroupColor: TColors | null = null;
    for (let i = activeItem.index; i >= 0; i--) {
      const item = flatData[i];
      if (!activeGroupKey && item.type === 'GROUP_HEADER') {
        activeGroupKey = item.key;
        activeGroupName = item.groupName;
        activeGroupColor = item.groupColor;
      }
      if (item.type === 'SECTION_HEADER') {
        activeSectionKey = item.key;
        activeSectionName = item.sectionName;
        if (!activeGroupKey) {
          const nextItem = flatData[i + 1];
          if (nextItem?.type === 'GROUP_HEADER') {
            activeGroupKey = nextItem.key;
            activeGroupName = nextItem.groupName;
            activeGroupColor = nextItem.groupColor;
          }
        }
        break;
      }
    }
    return {
      sectionKey: activeSectionKey,
      sectionName: activeSectionName,
      groupKey: activeGroupKey,
      groupName: activeGroupName,
      groupColor: activeGroupColor,
    };
  }, [scrollOffset, virtualItems, flatData]);

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

    rowVirtualizer.measure();
    requestAnimationFrame(() => {
      rowVirtualizer.scrollToIndex(newIndex, { align: 'start', behavior: 'auto' });
    });
  }, [clampedColumn, flatData, rowVirtualizer, parentRef]);

  useLayoutEffect(() => {
    if (anchorRef.current && parentRef.current && flatData.length > 0) {
      const { key, offset } = anchorRef.current;
      //const newIndex = flatData.findIndex((item) => item.key === key);

      requestAnimationFrame(() => {
        rowVirtualizer.scrollToOffset(offset, {
          align: 'start',
          behavior: 'auto',
        });
      });
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

  const handleStatusChange = useCallback(
    (id: number, newStatus: TStatusKey) => {
      if (!parentRef.current) return;

      // 1. Get current virtual items to find what's at the top
      const currentScroll = parentRef.current.scrollTop;
      const virtualItems = rowVirtualizer.getVirtualItems();
      if (virtualItems.length === 0 || !parentRef.current) return;

      const anchorItem = virtualItems.find((item) => item.start + item.size > currentScroll) || virtualItems[0];

      // 2. Calculate how many pixels will disappear ABOVE this anchor item
      const shrinkage = getPendingShrinkage(
        flatData,
        id,
        newStatus,
        selectedStatusKeys,
        anchorItem.index, // We only care about items before this index
        clampedColumn,
      );

      const test = getRemovedKeys(flatData, id, newStatus, selectedStatusKeys, anchorItem.index);
      console.log(currentScroll, anchorItem.start, test, shrinkage);
      // 3. Store the anchor with the shrinkage adjustment
      // We subtract shrinkage because the list is about to get shorter
      anchorRef.current = {
        key: anchorItem.key as string,
        offset: currentScroll - shrinkage,
      };

      // 4. Trigger mutation
      setRemovingEvents((prev) => new Map(prev).set(id, newStatus));
      patchEvent.mutate({
        data: { eventId: id, statusId: statusIdLookupByKey(newStatus) },
      });
    },
    [rowVirtualizer, flatData, selectedStatusKeys, clampedColumn, patchEvent, statusIdLookupByKey],
  );

  const handleApprove = useCallback(
    (id: number) => {
      handleStatusChange(id, 'APPROVED');
      //captureAnchor();
      //setRemovingEvents((prev) => new Map(prev).set(id, 'APPROVED'));
      //patchEvent.mutate({ data: { eventId: id, statusId: statusIdLookupByKey('APPROVED') } });
    },
    [handleStatusChange],
  );

  const handleDeny = useCallback(
    (id: number) => {
      handleStatusChange(id, 'REJECTED');
      //captureAnchor();
      //setRemovingEvents((prev) => new Map(prev).set(id, 'REJECTED'));
      //patchEvent.mutate({ data: { eventId: id, statusId: statusIdLookupByKey('REJECTED') } });
    },
    [handleStatusChange],
  );

  const handlePending = useCallback(
    (id: number) => {
      handleStatusChange(id, 'PENDING');
      //captureAnchor();
      //setRemovingEvents((prev) => new Map(prev).set(id, 'PENDING'));
      //patchEvent.mutate({ data: { eventId: id, statusId: statusIdLookupByKey('PENDING') } });
    },
    [handleStatusChange],
  );

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
                      <div className="bg-accent text-primary p-2 border-b-2 border-accent/50 h-10 flex items-center">{item.sectionName}</div>
                    </div>
                  )}

                  {item.type === 'GROUP_HEADER' && (
                    <div
                      className={cn(
                        'overflow-hidden transition-[height,opacity,transform] duration-300 ease-in-out',
                        item.isRemoving && 'opacity-0 -translate-y-1',
                      )}
                    >
                      <div className={cn('p-2 h-10 border-b-2 flex items-center border-t', badgeVariants({ color: item.groupColor }))}>
                        <span className="text-md">{item.groupName}</span>
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

function getPendingShrinkage(
  flatData: VirtualRowItem[],
  targetEventId: number,
  newStatus: TStatusKey,
  selectedStatusKeys: TStatusKey[],
  topVisibleItemIndex: number,
  clampedColumn: number,
): number {
  // 1. If the event is moving to a status that is still visible, it won't be removed
  if (selectedStatusKeys.includes(newStatus)) return 0;

  let totalShrinkage = 0;
  const processedGroups = new Set<string>();
  const processedSections = new Set<string>();

  for (let i = 0; i < topVisibleItemIndex; i++) {
    const item = flatData[i];

    // --- CASE 1: GROUP REF LOW & REMOVAL ---
    if (item.type === 'GROUP_ROW') {
      const gKey = item.key.split(':events')[0];
      if (processedGroups.has(gKey)) continue;
      processedGroups.add(gKey);

      // Find all rows belonging to this specific group in the current flatData
      const groupRows = flatData.filter((row) => row.type === 'GROUP_ROW' && row.key.startsWith(gKey)) as Extract<
        VirtualRowItem,
        { type: 'GROUP_ROW' }
      >[];

      const allEventsInGroup = groupRows.flatMap((r) => r.data);
      const currentRowCount = groupRows.length;

      // Calculate how many rows will exist after removal
      const remainingEvents = allEventsInGroup.filter((e) => e.eventId !== targetEventId);
      const newRowCount = Math.ceil(remainingEvents.length / clampedColumn);

      // Calculate pixel loss for rows
      if (currentRowCount > newRowCount) {
        totalShrinkage += (currentRowCount - newRowCount) * ROW_PX;
      }

      // If the group becomes completely empty, the GROUP_HEADER will also vanish
      if (newRowCount === 0) {
        totalShrinkage += GROUP_HEADER_PX;
      }
    }

    // --- CASE 2: SECTION HEADER REMOVAL ---
    if (item.type === 'SECTION_HEADER') {
      const sKey = item.key;
      if (processedSections.has(sKey)) continue;
      processedSections.add(sKey);

      // A section is removed if EVERY event in EVERY group within it is gone
      // We look ahead in the flatData to find all events belonging to this section
      const sectionRows = flatData.filter((row) => row.type === 'GROUP_ROW' && row.key.startsWith(sKey)) as Extract<
        VirtualRowItem,
        { type: 'GROUP_ROW' }
      >[];

      const allEventsInSection = sectionRows.flatMap((r) => r.data);

      // If the ONLY event left in the whole section is the one we are removing...
      const sectionWillBeEmpty = allEventsInSection.every((e) => e.eventId === targetEventId);

      if (sectionWillBeEmpty) {
        totalShrinkage += SECTION_HEADER_PX;
      }
    }
  }

  return totalShrinkage;
}

/*function getPendingShrinkage(
  flatData: VirtualRowItem[],
  targetEventId: number,
  newStatus: TStatusKey,
  selectedStatusKeys: TStatusKey[],
  topVisibleItemIndex: number,
): number {
  // 1. If the new status is still visible, nothing is removed.
  if (selectedStatusKeys.includes(newStatus)) return 0;

  const removedKeys = new Set<string>();

  // Counters to track the "Empty" state of parents
  const groupTotalRows = new Map<string, number>();
  const groupRemovedRows = new Map<string, number>();

  const sectionTotalGroups = new Map<string, number>();
  const sectionRemovedGroups = new Map<string, number>();

  // Helper functions based on your key shapes
  const getGroupKey = (rowKey: string) => rowKey.split(':events')[0];
  const getSectionKey = (key: string) => key.split(':room')[0];

  // 2. FIRST PASS: Map out the structure and identify rows to be killed
  for (const item of flatData) {
    const itemKey = item.key;

    if (item.type === 'GROUP_ROW') {
      const gKey = getGroupKey(itemKey);

      // Increment total rows count for this group
      groupTotalRows.set(gKey, (groupTotalRows.get(gKey) || 0) + 1);

      // A row is removed ONLY if the targetEvent was the only thing in it
      const isLastEventInRow = item.data.length === 1 && item.data[0].eventId === targetEventId;

      if (isLastEventInRow) {
        removedKeys.add(itemKey);
        groupRemovedRows.set(gKey, (groupRemovedRows.get(gKey) || 0) + 1);
      }
    } else if (item.type === 'GROUP_HEADER') {
      const sKey = getSectionKey(itemKey);
      // Increment total groups count for this section
      sectionTotalGroups.set(sKey, (sectionTotalGroups.get(sKey) || 0) + 1);
    }
  }

  // 3. SECOND PASS: Determine which headers are actually empty
  // Check groups first
  groupRemovedRows.forEach((removedCount, gKey) => {
    const totalInGroup = groupTotalRows.get(gKey) || 0;

    // Only remove group if ALL its rows are gone
    if (removedCount === totalInGroup && totalInGroup > 0) {
      removedKeys.add(gKey);

      // If group is removed, report it to the section
      const sKey = getSectionKey(gKey);
      sectionRemovedGroups.set(sKey, (sectionRemovedGroups.get(sKey) || 0) + 1);
    }
  });

  // Check sections next
  sectionRemovedGroups.forEach((removedCount, sKey) => {
    const totalInSection = sectionTotalGroups.get(sKey) || 0;

    // Only remove section if ALL its groups are gone
    if (removedCount === totalInSection && totalInSection > 0) {
      removedKeys.add(sKey);
    }
  });

  // 4. THIRD PASS: Calculate pixel height for items ABOVE the fold
  let pendingShrinkage = 0;
  for (let i = 0; i < topVisibleItemIndex; i++) {
    const item = flatData[i];

    if (removedKeys.has(item.key)) {
      switch (item.type) {
        case 'GROUP_ROW':
          pendingShrinkage += ROW_PX;
          break;
        case 'GROUP_HEADER':
          pendingShrinkage += GROUP_HEADER_PX;
          break;
        case 'SECTION_HEADER':
          pendingShrinkage += SECTION_HEADER_PX;
          break;
      }
    }
  }

  return pendingShrinkage;
}*/

function getRemovedKeys(
  flatData: VirtualRowItem[],
  targetEventId: number,
  newStatus: TStatusKey,
  selectedStatusKeys: TStatusKey[],
  topVisibleItemIndex: number,
) {
  const removedKeys = new Set<string>();
  const sectionKeys = new Set<string>();
  const groupKeys = new Set<string>();
  const rowKeys = new Set<string>();

  // 1. Identify if the status change results in hiding the event
  const isMovingToHidden = !selectedStatusKeys.includes(newStatus);
  if (!isMovingToHidden) {
    return { removedKeys, sectionKeys, groupKeys, rowKeys };
  }

  flatData.forEach((item) => {
    if (item.type === 'GROUP_ROW') {
      const remainingEvents = item.data.filter((e) => e.eventId !== targetEventId);
      if (remainingEvents.length === 0) {
        rowKeys.add(item.key);
        removedKeys.add(item.key);
      }
    }
  });

  // 3. Identify Groups that will have no visible rows
  const groupHeaders = flatData.filter((i): i is Extract<VirtualRowItem, { type: 'GROUP_HEADER' }> => i.type === 'GROUP_HEADER');

  groupHeaders.forEach((group) => {
    // Find all rows belonging to this group via key prefix
    const rowsInGroup = flatData.filter((i) => i.type === 'GROUP_ROW' && i.key.startsWith(group.key));

    // If all rows that belong to this group are in the 'rowKeys' set, the group is removed
    if (rowsInGroup.length > 0 && rowsInGroup.every((row) => rowKeys.has(row.key))) {
      groupKeys.add(group.key);
      removedKeys.add(group.key);
    }
  });

  // 4. Identify Sections that will have no visible groups
  const sectionHeaders = flatData.filter((i): i is Extract<VirtualRowItem, { type: 'SECTION_HEADER' }> => i.type === 'SECTION_HEADER');

  sectionHeaders.forEach((section) => {
    // Find all groups belonging to this section via key prefix
    const groupsInSection = groupHeaders.filter((g) => g.key.startsWith(section.key));

    // If all groups in this section are now in the 'groupKeys' set, the section is removed
    if (groupsInSection.length > 0 && groupsInSection.every((group) => groupKeys.has(group.key))) {
      removedKeys.add(section.key);
    }
  });

  let pendingShrinkage = 0;

  for (let i = 0; i < topVisibleItemIndex; i++) {
    const item = flatData[i];

    if (removedKeys.has(item.key)) {
      switch (item.type) {
        case 'GROUP_ROW':
          pendingShrinkage += ROW_PX;
          break;
        case 'GROUP_HEADER':
          pendingShrinkage += GROUP_HEADER_PX;
          break;
        case 'SECTION_HEADER':
          pendingShrinkage += SECTION_HEADER_PX;
          break;
      }
    }
  }

  return {
    removedKeys,
    pendingShrinkage,
  };
}
