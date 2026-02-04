// use-room-filtering.ts
import { useState, useEffect, useMemo, useCallback } from "react";
import { PUBLIC_IROOM } from "@/lib/services/public";

export function useRoomFiltering(rooms: PUBLIC_IROOM[] | undefined) {
  // Instant state for checkboxes
  const [checkedRooms, setCheckedRooms] = useState<Set<number>>(new Set());

  // Debounced state for the Worker/Calendar
  const [debouncedRooms, setDebouncedRooms] = useState<number[]>([]);

  // Initialize: When rooms first load, check them all
  useEffect(() => {
    if (rooms && rooms.length > 0) {
      const allRooms = rooms.map((r) => r.roomId);
      setCheckedRooms(new Set(allRooms));
      setDebouncedRooms(allRooms);
    }
  }, [rooms]);

  // Handle Debounce
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedRooms(Array.from(checkedRooms));
    }, 300);
    return () => clearTimeout(handler);
  }, [checkedRooms]);

  const toggleRoom = useCallback((id: number) => {
    setCheckedRooms((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  }, []);

  const filterByProjector = useCallback(() => {
    if (!rooms) return;
    const projectorIds = rooms
      .filter((r) => r.roomProperty?.some((p) => p.name === "HasProjector" && p.value === "true"))
      .map((r) => r.roomId);
    setCheckedRooms(new Set(projectorIds));
  }, [rooms]);

  const clearAll = useCallback(() => setCheckedRooms(new Set()), []);

  const selectAll = useCallback(() => {
    if (!rooms) return;
    setCheckedRooms(new Set(rooms.map((r) => r.roomId)));
  }, [rooms]);

  return {
    checkedRooms,
    debouncedRooms,
    toggleRoom,
    filterByProjector,
    clearAll,
    selectAll,
  };
}
