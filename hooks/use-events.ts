"use client";

import { IEvent, SEvent } from "@/lib/schemas/calendar";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import useSWR from "swr";
import { z } from "zod/v4";

export function useEvents(startDate: Date, endDate: Date) {
  const [isLoading, setLoading] = useState(true);
  const [events, setEvents] = useState<IEvent[]>();

  /*const { data } = useSWR<IEvent[]>(
    `/api/events?startdate=${startDate.toISOString()}&enddate=${endDate.toISOString()}`
  );*/

  const { isPending, error, data, isFetching } = useQuery({
    queryKey: ["events"],
    queryFn: async () => {
      const response = await fetch(`/api/events?startdate=${startDate.toISOString()}&enddate=${endDate.toISOString()}`);
      return await response.json();
    },
  });

  useEffect(() => {
    if (data) {
      setLoading(false);
      const events = z.array(SEvent).parse(data);
      setEvents(events);
    }
  }, [data]);

  return { isLoading, events };
}

export function useEvent(eventId: number) {
  const [isLoading, setLoading] = useState(true);
  const [event, setEvent] = useState<IEvent>();

  //const { data } = useSWR<IEvent[]>(`/api/events/${eventId}`);

  const { isPending, error, data, isFetching } = useQuery({
    queryKey: ["event", eventId],
    queryFn: async () => {
      const response = await fetch(`/api/events/${eventId}`);
      return await response.json();
    },
  });

  useEffect(() => {
    if (data) {
      setLoading(false);
      const events = z.array(SEvent).parse(data);
      if (events.length > 0) {
        setEvent(events[0]);
      }
    }
  }, [data]);

  return { isLoading, event };
}
