"use client";
import { PUBLIC_IROOM } from "@/lib/services/public";
import { useEffect, useMemo, useRef, useState } from "react";
import { Label } from "../ui/label";
import { Checkbox } from "../ui/checkbox";
import { Button } from "../ui/button";
import { FilterIcon } from "lucide-react";
import { Skeleton } from "../ui/skeleton";

export interface fakeRoomCategory {
  roomCategory: { name: string };
  roomId: string;
}

function createCategories(category: string, total: number): fakeRoomCategory[] {
  return [...Array(total).keys()].map((value, index) => {
    return { roomCategory: { name: category }, roomId: category + "-" + String(index) };
  });
}

export const RoomCategoryLayoutSkeleton = () => {
  const rooms: fakeRoomCategory[] = [
    ...createCategories("GroupA", 8),
    ...createCategories("GroupB", 4),
    ...createCategories("GroupC", 2),
  ];

  const roomsByCategory: Record<string, fakeRoomCategory[]> = {};
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

  return (
    <div className="space-y-6 w-(--public-calendar-filter-w-col-1) xs:w-(--public-calendar-filter-w-col-2) sm:w-(--public-calendar-filter-w-col-1) lg:w-(--public-calendar-filter-w-col-2) ">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-y-2 w-full border-b py-4 mb-4">
        <Skeleton className="w-50 h-8"></Skeleton>
        <Skeleton className="w-50 h-8"></Skeleton>
      </div>

      {rows.map((row, index) => (
        <div key={index} className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-1 lg:grid-cols-2 gap-4 w-full ">
          {/* Left category */}
          <div className="flex flex-col w-[180px]">
            <Skeleton className="h-7 w-45"></Skeleton>
            <div className="flex flex-col gap-2 mt-2">
              {roomsByCategory[row.left]?.map((room) => (
                <div key={room.roomId} className="flex items-center gap-2">
                  <Skeleton className="w-4 h-4"></Skeleton>
                  <Skeleton className="w-45 h-5"></Skeleton>
                </div>
              ))}
            </div>
          </div>

          {/* Right categories stacked */}
          <div className="flex flex-col gap-4 w-[180px]">
            {row.right.map((category) => (
              <div key={category} className="flex flex-col">
                <Skeleton className="h-7 w-45"></Skeleton>
                <div className="flex flex-col gap-2 mt-2">
                  {roomsByCategory[category]?.map((room) => (
                    <div key={room.roomId} className="flex items-center gap-2">
                      <Skeleton className="w-4 h-4"></Skeleton>
                      <Skeleton className="w-45 h-5"></Skeleton>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};
