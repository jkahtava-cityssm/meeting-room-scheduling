"use client";
import { PUBLIC_IROOM } from "@/services/public";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Label } from "../ui/label";
import { Checkbox } from "../ui/checkbox";
import { Button } from "../ui/button";
import { ChevronLeft, ChevronRight, FilterIcon } from "lucide-react";
import { formatDate } from "date-fns";

function useDebouncedToggle(delay: number = 100) {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const queueRef = useRef<number[]>([]);

  const debounceToggle = (roomId: number, toggleFn: (id: number) => void) => {
    queueRef.current.push(roomId);

    if (timeoutRef.current) clearTimeout(timeoutRef.current);

    timeoutRef.current = setTimeout(() => {
      const uniqueIds = Array.from(new Set(queueRef.current));
      uniqueIds.forEach((id) => toggleFn(id));
      queueRef.current = [];
    }, delay);
  };

  return debounceToggle;
}

const RoomCategoryLayout = ({
  rooms,
  onCheckedRoomsChange,
}: {
  rooms: PUBLIC_IROOM[];
  onCheckedRoomsChange?: (checkedRoomIds: number[]) => void;
}) => {
  const [checkedRooms, setCheckedRooms] = useState<Set<number>>(() => new Set(rooms.map((room) => room.roomId)));

  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  const debouncedToggleRoom = useDebouncedToggle(150);

  const toggleRoom = (roomId: number) => {
    setCheckedRooms((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(roomId)) {
        newSet.delete(roomId);
      } else {
        newSet.add(roomId);
      }
      return newSet;
    });
  };

  const handleRoomClick = (roomId: number) => {
    debouncedToggleRoom(roomId, toggleRoom);
  };

  useEffect(() => {
    if (!onCheckedRoomsChange) return;

    if (debounceRef.current) clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(() => {
      console.log("Checked rooms changed:");
      onCheckedRoomsChange(Array.from(checkedRooms));
    }, 300);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [checkedRooms, onCheckedRoomsChange]);

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
    <div className="space-y-6 w-(--public-calendar-filter-w-col-1) xs:w-(--public-calendar-filter-w-col-2) sm:w-(--public-calendar-filter-w-col-1) lg:w-(--public-calendar-filter-w-col-2) ">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-y-2 w-full border-b py-4 mb-4">
        <Label className="text-md font-bold">Meeting Room Filters</Label>
        <Button size="sm" className="text-xs w-50">
          <FilterIcon></FilterIcon> Select Rooms with Projectors
        </Button>
      </div>

      {rows.map((row, index) => (
        <div key={index} className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-1 lg:grid-cols-2 gap-4 w-full ">
          {/* Left category */}
          <div className="flex flex-col w-[180px]">
            <Label className="text-lg font-bold">{row.left}</Label>
            <div className="flex flex-col gap-2 mt-2">
              {roomsByCategory[row.left]?.map((room) => (
                <div key={room.roomId} className="flex items-center gap-2">
                  <Checkbox
                    id={`room-${room.roomId}`}
                    checked={checkedRooms.has(room.roomId)}
                    onCheckedChange={() => handleRoomClick(room.roomId)}
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

export const DateControls = () => {
  return (
    <div className=" flex w-full justify-center ">
      <div className=" flex w-full items-center px-4 py-2">
        {/* Left: Previous Button */}
        <div className="shrink-0">
          <Button>
            <ChevronLeft />
            Previous
          </Button>
        </div>

        {/* Center: Label */}
        <div className="grow text-center">
          <Label className=" block text-base font-semibold">{formatDate(new Date(), "MMMM do, yyyy")}</Label>
        </div>

        {/* Right: Next Button */}
        <div className="shrink-0">
          <Button>
            Next
            <ChevronRight />
          </Button>
        </div>
      </div>
    </div>
  );
};
