import { IEventSingleRoom } from '@/lib/schemas';
import { useVirtualizer } from '@tanstack/react-virtual';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { VirtualRowItem } from './user-request';
import { IRequestSection } from '../webworkers/generic-webworker';
import { TStatusKey } from '@/lib/types';

const SECTION_HEADER_PX = 40;
const GROUP_HEADER_PX = 40;
const HEADER_PX = SECTION_HEADER_PX + GROUP_HEADER_PX;
const ROW_PX = 628;

export function useCalendarVirtualization({
  requestSections,
  clampedColumn,
  overscanSize,
  removingEvents,
  removingEventIds,
  removingGroupIds,
  removingSectionIds,
  selectedStatusKeys,
  parentRef,
}: {
  requestSections: IRequestSection[];
  clampedColumn: number;
  overscanSize: number;
  removingEvents: Map<number, TStatusKey>;
  removingEventIds: Set<number>;
  removingGroupIds: Set<string>;
  removingSectionIds: Set<string>;
  selectedStatusKeys: TStatusKey[];
  parentRef: React.RefObject<HTMLDivElement | null>;
}) {
  const [collapsedKeys, setCollapsedKeys] = useState<Set<string>>(() => new Set());
  const collapseTimersRef = useRef<Map<string, number>>(new Map());

  const flatData = useMemo(() => {
    const list: VirtualRowItem[] = [];
    requestSections?.forEach((section) => {
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
        sectionName: section.sectionTitle,
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

        list.push({
          type: 'GROUP_HEADER',
          key: group.groupKey,
          groupName: group.groupName,
          groupColor: group.groupColor,
          isRemoving: isRemovingGroup,
        });

        const eventRows = chunkArray<IEventSingleRoom>(visibleEvents, clampedColumn);
        eventRows.forEach((eventRow, rowIndex) => {
          list.push({ type: 'GROUP_ROW', key: `${group.groupKey}:events[${rowIndex}]`, data: eventRow });
        });
      });
    });
    return list;
  }, [requestSections, removingSectionIds, removingGroupIds, selectedStatusKeys, removingEventIds, clampedColumn, removingEvents]);

  const isRemovingItem = useCallback(
    (item: VirtualRowItem) => {
      if (item.type === 'GROUP_ROW') {
        return (
          item.data.length > 0 &&
          item.data.every((e) => {
            const targetStatus = removingEvents.get(e.eventId);
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
    for (const item of flatData) {
      if (!isRemovingItem(item)) continue;
      const k = item.key;
      if (collapsedKeys.has(k) || timers.has(k)) continue;
      const duration = item.type === 'GROUP_ROW' ? 200 : 300;
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
    for (const [k, t] of timers) {
      const item = itemByKey.get(k);
      if (!item || !isRemovingItem(item)) {
        clearTimeout(t);
        timers.delete(k);
      }
    }
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

        if (!item) return 0;
        if (collapsedKeys.has(item.key)) return 0;

        if (item.type === 'SECTION_HEADER') return SECTION_HEADER_PX;
        if (item.type === 'GROUP_HEADER') return GROUP_HEADER_PX;
        return ROW_PX;
      },
      [collapsedKeys, flatData],
    ),
    measureElement: (el) => {
      const index = Number(el.getAttribute('data-index'));
      const item = flatData[index];
      if (!item) return 0;

      if (collapsedKeys.has(item.key)) return 0;

      return el.getBoundingClientRect().height;
    },
    overscan: overscanSize,
    scrollPaddingStart: SECTION_HEADER_PX,
    getItemKey: (index) => flatData[index]?.key ?? index,
  });

  return { flatData, rowVirtualizer, collapsedKeys, isRemovingItem };
}

function chunkArray<T>(arr: T[], size: number): T[][] {
  return Array.from({ length: Math.ceil(arr.length / size) }, (_, i) => arr.slice(i * size, i * size + size));
}
