import { useCallback, useLayoutEffect, useMemo, useRef } from 'react';
import { IRequestGroup, IRequestSection } from '../webworkers/generic-webworker';
import { Virtualizer } from '@tanstack/react-virtual';
import { VirtualRowItem } from './user-request-2';
import { TColors, TStatusKey } from '@/lib/types';

const SECTION_HEADER_PX = 40;
const GROUP_HEADER_PX = 40;
const HEADER_PX = SECTION_HEADER_PX + GROUP_HEADER_PX;
const ROW_PX = 628;

export function useCalendarScrollAnchoring({
  rowVirtualizer,
  flatData,
  clampedColumn,
  parentRef,
  isRemovingItem,
  selectedStatusKeys,
}: {
  rowVirtualizer: Virtualizer<HTMLDivElement, HTMLDivElement>;
  flatData: VirtualRowItem[];
  clampedColumn: number;
  parentRef: React.RefObject<HTMLDivElement | null>;
  isRemovingItem: (item: VirtualRowItem) => boolean;
  selectedStatusKeys: TStatusKey[];
}) {
  const anchorRef = useRef<{ key: string; offset: number } | null>(null);
  const prevColsRef = useRef(clampedColumn);
  const groupKeyRef = useRef<string | null>(null);

  const captureAnchor = useCallback(
    (targetEventId: number, newStatus: TStatusKey) => {
      const scrollElement = parentRef.current;
      if (!scrollElement) return;

      const currentScrollTop = scrollElement.scrollTop;
      const virtualItems = rowVirtualizer.getVirtualItems();
      const topVisibleItem = virtualItems[0];

      if (!topVisibleItem) return;

      const { removedKeys } = getRemovedKeys(flatData, targetEventId, newStatus, selectedStatusKeys);

      // We sum up what is ALREADY removing + what is ABOUT to be removed
      let pendingShrinkage = 0;

      for (let i = 0; i < topVisibleItem.index; i++) {
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

      //console.log({ item: topVisibleItem, top: currentScrollTop, shrink: pendingShrinkage, keys: removedKeys });

      anchorRef.current = {
        key: 'absolute-coord',
        //index: topVisibleItem.index,
        offset: currentScrollTop - pendingShrinkage,
      };
    },
    [parentRef, rowVirtualizer, flatData, selectedStatusKeys],
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
    if (anchorRef.current && parentRef.current) {
      const { key, offset } = anchorRef.current;

      if (key === 'absolute-coord') {
        parentRef.current.scrollTop = offset;
      } else {
        // Fallback: Original key-based anchoring logic
        const newItems = rowVirtualizer.getVirtualItems();
        const foundItem = newItems.find((item) => item.key === key);
        if (foundItem) {
          parentRef.current.scrollTop = foundItem.start + offset;
        }
      }
      anchorRef.current = null;
    }
  }, [flatData, rowVirtualizer, parentRef]);

  return { captureAnchor, stickyInfo };
}

export const getRemovedKeys = (flatData: VirtualRowItem[], targetEventId: number, newStatus: TStatusKey, selectedStatusKeys: TStatusKey[]) => {
  const removedKeys = new Set<string>();
  const sectionKeys = new Set<string>();
  const groupKeys = new Set<string>();
  const rowKeys = new Set<string>();

  // 1. Identify if the status change results in hiding the event
  const isMovingToHidden = !selectedStatusKeys.includes(newStatus);
  if (!isMovingToHidden) {
    return { removedKeys, sectionKeys, groupKeys, rowKeys };
  }

  // 2. Identify Rows that will become empty
  // We filter first so we have a complete list of "dying" rows to check against headers
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
      sectionKeys.add(section.key);
      removedKeys.add(section.key);
    }
  });

  return {
    removedKeys,
    sectionKeys,
    groupKeys,
    rowKeys,
  };
};
