"use client";
import { PUBLIC_IROOM } from "@/services/public";
import { useEffect, useMemo, useState } from "react";
import { Label } from "../ui/label";
import { Checkbox } from "../ui/checkbox";

const RoomCategoryLayout = ({
  rooms,
  onCheckedRoomsChange,
}: {
  rooms: PUBLIC_IROOM[];
  onCheckedRoomsChange?: (checkedRoomIds: number[]) => void;
}) => {
  const [checkedRooms, setCheckedRooms] = useState<Set<number>>(new Set());

  const toggleRoom = (roomId: number) => {
    setCheckedRooms((prev: Set<number>) => {
      const newSet = new Set(prev);
      if (newSet.has(roomId)) {
        newSet.delete(roomId);
      } else {
        newSet.add(roomId);
      }

      return newSet;
    });
  };

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
    <div className="space-y-6">
      {rows.map((row, index) => (
        <div key={index} className="grid grid-cols-1 xs:grid-cols-2 gap-4 w-full">
          {/* Left category */}
          <div className="flex flex-col w-[180px]">
            <Label className="text-lg font-bold">{row.left}</Label>
            <div className="flex flex-col gap-2 mt-2">
              {roomsByCategory[row.left]?.map((room) => (
                <div key={room.roomId} className="flex items-center gap-2">
                  <Checkbox
                    id={`room-${room.roomId}`}
                    checked={checkedRooms.has(room.roomId)}
                    onCheckedChange={() => toggleRoom(room.roomId)}
                  />
                  <Label htmlFor={`room-${room.roomId}`} className="text-sm font-medium">
                    {room.name}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          {/* Right categories stacked */}
          <div className="flex flex-col gap-4 w-[180px]">
            {row.right.map((category) => (
              <div key={category} className="flex flex-col">
                <Label className="text-lg font-bold">{category}</Label>
                <div className="flex flex-col gap-2 mt-2">
                  {roomsByCategory[category]?.map((room) => (
                    <div key={room.roomId} className="flex items-center gap-2">
                      <Checkbox
                        id={`room-${room.roomId}`}
                        checked={checkedRooms.has(room.roomId)}
                        onCheckedChange={() => toggleRoom(room.roomId)}
                      />
                      <Label htmlFor={`room-${room.roomId}`} className="text-sm font-medium">
                        {room.name}
                      </Label>
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
export default RoomCategoryLayout;
