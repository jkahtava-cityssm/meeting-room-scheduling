"use client";

import { IEvent, SEvent } from "@/lib/schemas/calendar";
import { useEffect, useState } from "react";
import useSWR from "swr";
import { z } from "zod/v4";

export function useEvents(startDate: Date, endDate: Date) {
  const [isLoading, setLoading] = useState(true);
  const [events, setEvents] = useState<IEvent[]>();

  const { data } = useSWR<IEvent[]>(
    `/api/events?startdate=${startDate.toISOString()}&enddate=${endDate.toISOString()}`
  );

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

  const { data } = useSWR<IEvent[]>(`/api/events/${eventId}`);

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
