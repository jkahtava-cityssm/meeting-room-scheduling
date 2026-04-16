'use client';
import { usePrivateCalendar } from '@/contexts/CalendarProviderPrivate';

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';

import { cn } from '@/lib/utils';
import { CalendarDayColumnCalendar } from '../sidebar-day-picker/calendar-day-column-calendar';

import { usePrivateCalendarEvents } from '../webworkers/use-calendar-private-events';
import { CalendarScrollContainerPrivate } from '../components/calendar-scroll-container';
import { CalendarScrollColumnPrivate } from '../components/calendar-scroll-column';

import { CalendarScrollContainerSkeleton } from '../components/calendar-scroll-container-skeleton';

import { LoaderCircle, LucideCalendarDays, LucideDoorOpen, LucidePartyPopper, Terminal } from 'lucide-react';
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

      list.push({
        type: 'SECTION_HEADER',
        key: section.sectionKey,
        sectionKey: section.sectionKey,
        sectionName: section.sectionTitle,
        groupKey: null,
        groupName: null,
        groupColor: null,
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
        currentGroup = null; // Reset group when section changes
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
    const topThreshold = scrollOffset + HEADER_PX;

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

  const activeMutationsRef = useRef(0);

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

      const shrinkage2 = getPendingShrinkage2(
        flatData,
        id,
        newStatus,
        selectedStatusKeys,
        anchorItem.index, // We only care about items before this index
        clampedColumn,
      );

      console.log(shrinkage, shrinkage2);
      // 3. Store the anchor with the shrinkage adjustment
      // We subtract shrinkage because the list is about to get shorter
      anchorRef.current = {
        key: anchorItem.key as string,
        offset: currentScroll - shrinkage2,
      };

      /*if (shrinkage > 0) {
        parentRef.current.scrollTop = currentScroll - shrinkage;
      }*/

      // 4. Trigger mutation

      activeMutationsRef.current += 1;

      setRemovingEvents((prev) => new Map(prev).set(id, newStatus));
      patchEvent.mutate(
        {
          data: { eventId: id, statusId: statusIdLookupByKey(newStatus) },
          statusKey: newStatus,
        },
        /*{
          onSettled: () => {
            activeMutationsRef.current -= 1;

            // If no more mutations are pending, we can safely clear the anchor
            // after the final data paint. We use a small delay to ensure the
            // last invalidation refetch has finished rendering.
            if (activeMutationsRef.current === 0) {
              setTimeout(() => {
                anchorRef.current = null;
              }, 100);
            }
          },
        },*/
      );
    },
    [parentRef, rowVirtualizer, flatData, selectedStatusKeys, clampedColumn, patchEvent, statusIdLookupByKey],
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

function getPendingShrinkage2(
  flatData: VirtualRowItem[],
  targetEventId: number,
  newStatus: TStatusKey,
  selectedStatusKeys: TStatusKey[],
  topVisibleItemIndex: number,
  clampedColumn: number,
): number {
  // The event is changing to a visible status key
  // As a result it will not be removed so no calculations are required.
  if (selectedStatusKeys.includes(newStatus)) return 0;

  let totalShrinkage = 0;

  const processedGroups = new Set<string>();
  const processedSections = new Set<string>();

  //Build lookup Sets
  const groupContainsTarget = new Set<string>();
  const sectionContainsTarget = new Set<string>();
  const groupHeaderMap = new Map<string, Extract<VirtualRowItem, { type: 'GROUP_HEADER' }>>();

  for (const item of flatData) {
    if (item.type === 'GROUP_HEADER') {
      groupHeaderMap.set(item.key, item);
    }

    if (item.type === 'GROUP_ROW') {
      if (item.data.some((e) => e.eventId === targetEventId)) {
        const gKey = item.groupKey;
        if (gKey) {
          groupContainsTarget.add(gKey);
        }
        if (item.sectionKey) {
          sectionContainsTarget.add(item.sectionKey);
        }
      }
    }
  }

  for (let i = 0; i < topVisibleItemIndex; i++) {
    const item = flatData[i];

    // ========== GROUP SHRINK ==========
    if (item.type === 'GROUP_ROW') {
      const gKey = item.groupKey;
      if (!gKey || processedGroups.has(gKey)) continue;
      processedGroups.add(gKey);

      if (!groupContainsTarget.has(gKey)) continue;

      const groupHeader = groupHeaderMap.get(gKey);

      if (!groupHeader) continue;

      // We do not care which event is removed, only that a single event is being removed
      const newEventCount = groupHeader.eventCount - 1;

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

      if (!sectionContainsTarget.has(sKey)) continue;

      // Remove an event from the Section to see if it would also become empty
      const newSectionEventCount = item.totalEventCount - 1;

      // If the section becomes empty, its header is removed from the layout
      if (newSectionEventCount === 0) {
        totalShrinkage += SECTION_HEADER_PX;
      }
    }
  }

  return totalShrinkage;
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
