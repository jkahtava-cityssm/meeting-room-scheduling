"use client";

import { IRoom, SRoom } from "@/lib/schemas/calendar";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { z } from "zod/v4";

export function useRooms() {
  const [isLoading, setLoading] = useState(true);
  const [rooms, setRooms] = useState<IRoom[]>();

  const { isPending, error, data, isFetching } = useQuery({
    queryKey: ["rooms"],
    queryFn: async () => {
      const response = await fetch(`/api/rooms/`);
      return await response.json();
    },
  });

  useEffect(() => {
    if (data) {
      setLoading(false);
      const rooms = z.array(SRoom).parse(data);
      setRooms(rooms);
    }
  }, [data]);

  return { isLoading, rooms };
}
