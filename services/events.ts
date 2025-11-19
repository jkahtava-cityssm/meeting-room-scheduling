import { formatISO } from "date-fns";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchPUT, fetchGET, fetchDELETE, fetchPATCH } from "@/lib/fetch";
import z from "zod/v4";
import { IEvent, SEvent } from "@/lib/schemas/calendar";
import { Prisma } from "@prisma/client";

//const queryClient = new QueryClient();

export const useEventsQuery = (startDate: Date, endDate: Date, userId?: string, enabled: boolean = true) =>
  useQuery({
    queryKey: ["events", formatDate(startDate), formatDate(endDate), userId],
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

export const useEventsByStatusQuery = (startDate: Date, endDate: Date, statusId?: string, enabled: boolean = true) =>
  useQuery({
    queryKey: ["event_status", formatDate(startDate), formatDate(endDate), statusId],
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

const formatDate = (date: Date) => {
  return formatISO(date);
};

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
    }: {
      eventId: number;
      updates: Prisma.EventUpdateInput; // Matches your PATCH endpoint typing
      ruleData?: Prisma.RecurrenceUpdateInput | null;
    }) => {
      return fetchPATCH("/api/events", {
        eventData: { eventId, ...updates },
        ruleData,
      });
    },

    onMutate: async (variables) => {
      await queryClient.cancelQueries({ queryKey: ["events"] });
      await queryClient.cancelQueries({ queryKey: ["event", variables.eventId] });

      const previousEvents = queryClient.getQueryData<IEvent[]>(["events"]);
      const previousEvent = queryClient.getQueryData<IEvent>(["event", variables.eventId]);

      // Update the events list optimistically
      if (previousEvents) {
        queryClient.setQueryData(["events"], (old: IEvent[] | undefined) =>
          old?.map((event) => (event.eventId === variables.eventId ? { ...event, ...variables.updates } : event))
        );
      }

      // Update the single event optimistically
      if (previousEvent) {
        queryClient.setQueryData(["event", variables.eventId], {
          ...previousEvent,
          ...variables.updates,
        });
      }

      return { previousEvents, previousEvent };
    },
    onError: (err, variables, context) => {
      // Rollback on error
      if (context?.previousEvents) {
        queryClient.setQueryData(["events"], context.previousEvents);
      }
      if (context?.previousEvent) {
        queryClient.setQueryData(["event", variables.eventId], context.previousEvent);
      }
    },
    onSettled: (data, error, variables) => {
      // Remove the single event from cache after success
      queryClient.removeQueries({ queryKey: ["event", variables.eventId] });
      queryClient.invalidateQueries({ queryKey: ["events"] });
    },
  });
};
