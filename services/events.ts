import { formatISO } from "date-fns";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchPUT, fetchGET, fetchDELETE, fetchPATCH } from "@/lib/fetch";
import z from "zod/v4";
import { IEvent, SEvent } from "@/lib/schemas/calendar";
import { Prisma } from "@prisma/client";

//const queryClient = new QueryClient();
const formatDate = (date: Date) => {
  return formatISO(date);
};

export const useEventsQuery = (startDate: Date, endDate: Date, userId?: string, enabled: boolean = true) =>
  useQuery({
    queryKey: ["events", formatDate(startDate), formatDate(endDate), "user", userId],
    queryFn: async () =>
      fetchGET("/api/events", {
        startdate: formatDate(startDate),
        enddate: formatDate(endDate),
        userId: userId,
      }).then((result) => {
        const parsedResult = z.array(SEvent).safeParse(result.data);

        if (!parsedResult.success) throw new Error("Invalid event data");

        return parsedResult.data;
      }),
    enabled: enabled,
  });

export const useEventsByStatusQuery = (startDate: Date, endDate: Date, statusId: string, enabled: boolean = true) =>
  useQuery({
    queryKey: ["events", formatDate(startDate), formatDate(endDate), "status", statusId],
    queryFn: async () =>
      fetchGET("/api/events/status", {
        startdate: formatDate(startDate),
        enddate: formatDate(endDate),
        statusId: statusId,
      }).then((result) => {
        const parsedResult = z.array(SEvent).safeParse(result.data);

        if (!parsedResult.success) throw new Error("Invalid event data");

        return parsedResult.data;
      }),
    enabled: enabled,
  });

export const useTotalEventsByStatusQuery = (
  statusId: string,
  startDate?: Date,
  endDate?: Date,
  enabled: boolean = true
) =>
  useQuery({
    queryKey: ["total_events", "status", statusId],
    queryFn: async () =>
      fetchGET("/api/events/status/counts", {
        startdate: startDate ? formatDate(startDate) : undefined,
        enddate: endDate ? formatDate(endDate) : undefined,
        statusId: statusId,
      }).then((result) => {
        return result.data;
      }),
    refetchInterval: 60 * 1000,
    refetchIntervalInBackground: true,
    enabled: enabled,
    staleTime: 60 * 1000,
  });

export const useEventQuery = (eventId: number | undefined, enabled: boolean = true) =>
  useQuery({
    queryKey: ["event", eventId],
    queryFn: async () =>
      fetchGET(`/api/events/${eventId}`).then((result) => {
        const parsedResult = z.array(SEvent).safeParse(result.data);

        if (!parsedResult.success) throw new Error("Invalid event data");

        return parsedResult.data[0];
      }),
    enabled: enabled && eventId !== undefined,
    gcTime: 0,
    staleTime: 0,
  });

type eventObject = {
  eventId?: number;
  roomId: number;
  startDate: string;
  endDate: string;
  title: string;
  description?: string;
  recurrenceId?: number;
};

type ruleObject = {
  rule: string;
  ruleStartDate: string;
  ruleEndDate: string;
};

type mutationObject = {
  eventData: eventObject;
  ruleData: ruleObject | null;
};

export const useEventsMutationUpsert = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: mutationObject) => fetchPUT(`/api/events`, data),
    onSuccess: (response) => {
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: ["events"] });
      queryClient.invalidateQueries({ queryKey: ["event", response.data.eventId] });
    },
  });
};

export const useEventsMutationDelete = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (eventId: number) => fetchDELETE(`/api/events/${eventId}`),
    onSuccess: () => {
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: ["events"] });
      //queryClient.invalidateQueries({ queryKey: ["event", response.data.eventId] });
    },
  });
};
export const useEventPatchMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      eventId,
      updates,
      ruleData,
      cacheTags,
    }: {
      eventId: number;
      updates: Prisma.EventUpdateInput;
      ruleData?: Prisma.RecurrenceUpdateInput | null;
      cacheTags: { startDate: string; endDate: string; type: "user" | "status"; id: string };
    }) => {
      return fetchPATCH("/api/events", {
        eventData: { eventId, ...updates },
        ruleData,
      });
    },

    onMutate: async (variables) => {
      const eventKey = ["event", variables.eventId];
      const eventsKey = buildEventKey(variables.cacheTags);

      await queryClient.cancelQueries({ queryKey: eventsKey });
      await queryClient.cancelQueries({ queryKey: eventKey });

      const previousEvents = queryClient.getQueryData<IEvent[]>(eventsKey);
      const previousEvent = queryClient.getQueryData<IEvent>(eventKey);

      // Optimistic update for events list
      if (previousEvents) {
        queryClient.setQueryData(eventsKey, (old: IEvent[] | undefined) =>
          old?.map((event) =>
            event.eventId === variables.eventId
              ? {
                  ...event,
                  // Apply only known fields from updates
                  statusId: variables.updates.status?.connect?.statusId ?? event.statusId,
                }
              : event
          )
        );
      }

      // Optimistic update for single event
      if (previousEvent) {
        queryClient.setQueryData(eventKey, {
          ...previousEvent,
          statusId: variables.updates.status?.connect?.statusId ?? previousEvent.statusId,
        });
      }

      return { previousEvents, previousEvent };
    },

    onError: (err, variables, context) => {
      const eventsKey = buildEventKey(variables.cacheTags);
      const eventKey = ["event", variables.eventId];

      if (context?.previousEvents) {
        queryClient.setQueryData(eventsKey, context.previousEvents);
      }
      if (context?.previousEvent) {
        queryClient.setQueryData(eventKey, context.previousEvent);
      }
    },

    onSettled: (data, error, variables) => {
      const eventsKey = buildEventKey(variables.cacheTags);
      const eventKey = ["event", variables.eventId];

      queryClient.invalidateQueries({ queryKey: eventsKey });
      queryClient.invalidateQueries({ queryKey: eventKey });
    },
  });
};

const buildEventKey = (tags: { startDate: string; endDate: string; type: string; id: string }) => [
  "events",
  tags.startDate,
  tags.endDate,
  tags.type,
  tags.id,
];
