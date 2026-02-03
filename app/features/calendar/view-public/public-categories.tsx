"use client";

import { PUBLIC_IROOM } from "@/lib/services/public";
import { useEffect, useMemo, useRef, useState } from "react";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import React from "react";

export const RoomCategoryLayout = ({
  rooms,
  checkedRooms,
  onToggleRoom,
  className,
}: {
  rooms: PUBLIC_IROOM[];
  checkedRooms: Set<number>;
  onToggleRoom: (id: number) => void;
  className?: string;
}) => {
  const { roomsByCategory, rows } = useMemo(() => {
    const roomsByCategory: Record<string, PUBLIC_IROOM[]> = {};
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

  return (
    <div className={cn("w-full", className)}>
      <div className={cn("flex flex-wrap gap-x-2 gap-y-8", className)}>
        {rows.map((row, index) => (
          <React.Fragment key={index}>
            <Group
              key={index}
              categories={[row.left]}
              roomsByCategory={roomsByCategory}
              checkedRooms={checkedRooms}
              toggleRoom={onToggleRoom}
            />
            <Group
              categories={row.right}
              roomsByCategory={roomsByCategory}
              checkedRooms={checkedRooms}
              toggleRoom={onToggleRoom}
            />
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};

const Group = ({
  categories,
  roomsByCategory,
  checkedRooms,
  toggleRoom,
}: {
  categories: string[];
  roomsByCategory: Record<string, PUBLIC_IROOM[]>;
  checkedRooms: Set<number>;
  toggleRoom: (roomId: number) => void;
}) => (
  <div className="min-w-[180px] flex-1 lg:flex-none">
    <div className="flex flex-col gap-4">
      {categories.map((category) => (
        <GroupHeader key={category} category={category}>
          {roomsByCategory[category]?.map((room) => (
            <GroupRow key={room.roomId} room={room} checkedRooms={checkedRooms} toggleRoom={toggleRoom} />
          ))}
        </GroupHeader>
      ))}
    </div>
  </div>
);

const GroupHeader = ({ category, children }: { category: string; children: React.ReactNode }) => (
  <div className="flex flex-col">
    <Label className="text-lg font-bold">{category}</Label>
    <div className="mt-2 space-y-2">{children}</div>
  </div>
);

const GroupRow = ({
  room,
  checkedRooms,
  toggleRoom,
}: {
  room: PUBLIC_IROOM;
  checkedRooms: Set<number>;
  toggleRoom: (roomId: number) => void;
}) => (
  <div className="flex items-start gap-3 py-1">
    <Checkbox
      id={`room-${room.roomId}`}
      checked={checkedRooms.has(room.roomId)}
      onCheckedChange={() => toggleRoom(room.roomId)}
      className="mt-0.5 shrink-0"
    />
    <Label htmlFor={`room-${room.roomId}`} className="text-sm font-medium leading-tight cursor-pointer break-words">
      {room.name}
    </Label>
  </div>
);
