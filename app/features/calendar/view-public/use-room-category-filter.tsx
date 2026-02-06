import { PUBLIC_IROOM } from "@/lib/services/public";
import { useMemo } from "react";

export interface BaseRoom {
  roomId: string | number;
  roomCategory: { name: string };
}

export const useRoomLayout = <T extends BaseRoom>(rooms: T[]) => {
  return useMemo(() => {
    const roomsByCategory: Record<string, T[]> = {};
    const categoryCounts: Record<string, number> = {};

    for (const room of rooms) {
      const category = room.roomCategory.name;
      if (!roomsByCategory[category]) roomsByCategory[category] = [];
      roomsByCategory[category].push(room);
      categoryCounts[category] = (categoryCounts[category] || 0) + 1;
    }

    const sortedCategories = Object.entries(categoryCounts).sort(([, countA], [, countB]) => countB - countA);

    const rows: { left: string; right: string[] }[] = [];

    while (sortedCategories.length > 0) {
      const shifted = sortedCategories.shift();
      if (!shifted) break;
      const [leftCategory, leftCount] = shifted;
      const rightCategories: [string, number][] = [];
      let rightTotal = 0;

      for (let i = 0; i < sortedCategories.length; ) {
        const [cat, count] = sortedCategories[i];
        if (rightTotal < leftCount) {
          rightCategories.push([cat, count]);
          rightTotal += count;
          sortedCategories.splice(i, 1);
        } else {
          i++;
        }
      }

      if (rightTotal > leftCount + 3 && rightCategories.length > 0) {
        const [lastCat, lastCount] = rightCategories[rightCategories.length - 1];
        rightTotal -= lastCount;
        sortedCategories.unshift([lastCat, lastCount]);
        rightCategories.pop();
      }

      rows.push({
        left: leftCategory,
        right: rightCategories.map(([cat]) => cat),
      });
    }

    return { roomsByCategory, rows };
  }, [rooms]);
};
