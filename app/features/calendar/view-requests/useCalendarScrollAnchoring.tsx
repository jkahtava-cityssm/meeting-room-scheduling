import { useCallback, useLayoutEffect, useMemo, useRef } from 'react';
import { IRequestGroup } from '../webworkers/generic-webworker';
import { Virtualizer } from '@tanstack/react-virtual';
import { VirtualRowItem } from './user-request-2';
import { TColors } from '@/lib/types';

const SECTION_HEADER_PX = 40;
const GROUP_HEADER_PX = 40;
const HEADER_PX = SECTION_HEADER_PX + GROUP_HEADER_PX;

export function useCalendarScrollAnchoring({
  rowVirtualizer,
  flatData,
  clampedColumn,
  parentRef,
  isRemovingItem,
}: {
  rowVirtualizer: Virtualizer<HTMLDivElement, HTMLDivElement>;
  flatData: VirtualRowItem[];
  clampedColumn: number;
  parentRef: React.RefObject<HTMLDivElement | null>;
  isRemovingItem: (item: VirtualRowItem) => boolean;
}) {
  const anchorRef = useRef<{ key: string; offset: number } | null>(null);
  const prevColsRef = useRef(clampedColumn);
  const groupKeyRef = useRef<string | null>(null);

  const captureAnchor = useCallback(() => {
    const virtualItems = rowVirtualizer.getVirtualItems();
    if (virtualItems.length === 0) return;
    const anchorItem = virtualItems[0];
    const scrollElement = parentRef.current;
    if (anchorItem && scrollElement) {
      anchorRef.current = {
        key: anchorItem.key as string,
        offset: scrollElement.scrollTop - anchorItem.start,
      };
    }
  }, [rowVirtualizer, parentRef]);

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
      const newItems = rowVirtualizer.getVirtualItems();
      const foundItem = newItems.find((item) => item.key === key);
      if (foundItem) {
        parentRef.current.scrollTop = foundItem.start + offset;
      }
      anchorRef.current = null;
    }
  }, [flatData, rowVirtualizer, parentRef]);

  return { captureAnchor, stickyInfo };
}
