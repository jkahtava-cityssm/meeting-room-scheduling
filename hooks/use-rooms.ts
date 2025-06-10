"use client";

import { IRoom, SRoom } from "@/lib/schemas/calendar";
import { useEffect, useState } from "react";
import useSWR from "swr";
import { z } from "zod";

export function useRooms() {
  const [isLoading, setLoading] = useState(true);
  const [rooms, setRooms] = useState<IRoom[]>();

  const { data } = useSWR<IRoom[]>(`/api/rooms/`);

  useEffect(() => {
    if (data) {
      setLoading(false);
      const rooms = z.array(SRoom).parse(data);
      setRooms(rooms);
    }
  }, [data]);

  return { isLoading, rooms };
}
