import { formatISO } from "date-fns";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchPUT, fetchGET, fetchDELETE, fetchPATCH, fetchPOST } from "@/lib/fetch";
import z from "zod/v4";
import { IEvent, SEvent, utcDateSchema } from "@/lib/schemas";
import { Prisma } from "@prisma/client";
import { processEventsAsync } from "@/app/features/calendar/webworkers/generic-webworker-client";
import { CalendarAction, ISODateString } from "@/app/features/calendar/webworkers/generic-webworker";
import { getDateRange } from "@/app/features/calendar/webworkers/generic-webworker-utilities";
import { TVisibleHours } from "../types";
import { QueryError } from "@/contexts/ReactQueryProvider";
import { queryKeys } from "./querykeys";

//const queryClient = new QueryClient();
const formatDate = (date: Date) => {
  return formatISO(date);
};

export const useEventsQuery = (startDate: Date, endDate: Date, userId?: string, enabled: boolean = true) => {
  const endpoint = userId ? "/api/events/my-events" : "/api/events";
  const start = formatDate(startDate);
  const end = formatDate(endDate);

  return useQuery({
    queryKey: queryKeys.events.user(start, end, userId),
    queryFn: async () => {
      const result = await fetchGET(endpoint, {
        startdate: start,
        enddate: end,
        userId: userId,
      });
      const parsedResult = z.array(SEvent).safeParse(result.data);

      if (!parsedResult.success) {
        throw new QueryError("Invalid event data", "useEventsQuery", parsedResult.error);
      }

      return parsedResult.data;
    },
    enabled: enabled,
  });
};

export const useMyEventsQuery = (
  action: CalendarAction,
  date: Date,
  userId: string,
  visibleHours: TVisibleHours,
  roomId?: string | string[],
  enabled: boolean = true,
) => {
  const range = getDateRange(action, date);
  const start = formatDate(range.startDate);
  const end = formatDate(range.endDate);

  return useQuery({
    queryKey: queryKeys.events.user(start, end, userId),
    queryFn: async () => {
      const result = await fetchGET("/api/events/my-events", {
        startdate: start,
        enddate: end,
        userId: userId,
      });
      const parsedResult = z.array(SEvent).safeParse(result.data);

      if (!parsedResult.success) {
        throw new QueryError("Invalid event data", "useMyEventsQuery", parsedResult.error);
      }

      return await processEventsAsync({
        events: result.data as IEvent[],
        selectedDate: date.toISOString() as ISODateString,
        selectedRoomId: roomId,
        action: action,
        visibleHours,
        multiDayEventsAtTop: true,
        userId: userId,
      });

      return parsedResult.data;
    },
    enabled: enabled,
  });
};

export const useEventsByStatusQuery = (startDate: Date, endDate: Date, statusId: string, enabled: boolean = true) => {
  const start = formatDate(startDate);
  const end = formatDate(endDate);

  return useQuery({
    queryKey: queryKeys.events.status(start, end, statusId),
    queryFn: async () => {
      const result = await fetchGET("/api/events/status", {
        startdate: start,
        enddate: end,
        statusId: statusId,
      });
      const parsedResult = z.array(SEvent).safeParse(result.data);

      if (!parsedResult.success) {
        throw new QueryError("Invalid event data", "useEventsByStatusQuery", parsedResult.error);
      }

      return parsedResult.data;
    },
    enabled: enabled,
  });
};

export const useTotalEventsByStatusQuery = (
  statusId: string,
  startDate?: Date,
  endDate?: Date,
  enabled: boolean = true,
) =>
  useQuery({
    queryKey: queryKeys.events.totalByStatus(statusId),
    queryFn: async () => {
      const result = await fetchGET("/api/events/status/counts", {
        startdate: startDate ? formatDate(startDate) : undefined,
        enddate: endDate ? formatDate(endDate) : undefined,
        statusId: statusId,
      });

      if (!result.data) throw new Error("Invalid total events");

      return result.data;
    },
    refetchInterval: 60 * 1000,
    refetchIntervalInBackground: true,
    enabled: enabled,
    staleTime: 60 * 1000,
  });

export const useEventQuery = (eventId: number | undefined, userId: string | undefined, enabled: boolean = true) => {
  const endpoint = userId ? `/api/events/my-events/${eventId}` : `/api/events/${eventId}`;
  return useQuery({
    queryKey: queryKeys.events.detail(eventId),
    queryFn: async () => {
      const result = await fetchGET(endpoint);
      const parsedResult = SEvent.safeParse(result.data);

      if (!parsedResult.success) {
        throw new QueryError("Invalid event data", "useEventQuery", parsedResult.error);
      }

      return parsedResult.data;
    },
    enabled: enabled && eventId !== undefined,
    gcTime: 0,
    staleTime: 0,
  });
};

export const SEventPUT = z.object({
  eventId: z.coerce.number().optional(),
  userId: z.coerce.number().nullable().optional(),
  statusId: z.coerce.number(),
  title: z.string().min(1, "Title is required"),
  description: z.string().default(""),
  startDate: utcDateSchema,
  endDate: utcDateSchema,
  recurrenceId: z.coerce.number().nullable().optional(),
  rule: z.string().optional(),
  ruleStartDate: utcDateSchema.optional(),
  ruleEndDate: utcDateSchema.optional(),
  eventRecipients: z.array(z.coerce.number()).optional(),
  eventItems: z.array(z.coerce.number()).optional(),
  eventRooms: z.array(z.coerce.number()).length(1, "At least one room is required"),
});

export type IEventPUT = z.infer<typeof SEventPUT>;

export const useEventsMutationUpsert = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: IEventPUT) => fetchPUT(`/api/events`, data),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.events.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.events.detail(response.data.eventId) });
    },
  });
};

export const useEventsMutationCreate = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: IEventPUT) => fetchPOST(`/api/events`, data),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.events.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.events.detail(response.data.eventId) });
    },
  });
};

export const useEventsMutationDelete = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (eventId: number) => fetchDELETE(`/api/events/${eventId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.events.all });
    },
  });
};
export const useEventPatchMutation = () => {
  const queryClient = useQueryClient();

  const getContextKey = (tags: { startDate: string; endDate: string; type: "user" | "status"; id: string }) => {
    return tags.type === "user"
      ? queryKeys.events.user(tags.startDate, tags.endDate, tags.id)
      : queryKeys.events.status(tags.startDate, tags.endDate, tags.id);
  };

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
      const eventKey = queryKeys.events.detail(variables.eventId);
      const eventsKey = getContextKey(variables.cacheTags);

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
              : event,
          ),
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
      const eventsKey = getContextKey(variables.cacheTags);
      const eventKey = queryKeys.events.detail(variables.eventId);

      if (context?.previousEvents) {
        queryClient.setQueryData(eventsKey, context.previousEvents);
      }
      if (context?.previousEvent) {
        queryClient.setQueryData(eventKey, context.previousEvent);
      }
    },

    onSettled: (data, error, variables) => {
      const eventsKey = getContextKey(variables.cacheTags);

      queryClient.invalidateQueries({ queryKey: eventsKey });
      queryClient.invalidateQueries({ queryKey: queryKeys.events.detail(variables.eventId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.events.all });
    },
  });
};
