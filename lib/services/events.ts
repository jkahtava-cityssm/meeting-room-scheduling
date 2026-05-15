import { formatISO } from 'date-fns';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchPUT, fetchGET, fetchDELETE, fetchPATCH, fetchPOST } from '@/lib/fetch-client';
import z from 'zod/v4';
import { IEvent, SEvent, utcDateSchema } from '@/lib/schemas';
import { processEventsAsync } from '@/app/features/calendar/webworkers/generic-webworker-client';
import { CalendarAction, ISODateString } from '@/app/features/calendar/webworkers/generic-webworker';
import { getDateRange } from '@/app/features/calendar/webworkers/generic-webworker-utilities';
import { TStatusKey, TVisibleHours } from '../types';
import { QueryError } from '@/contexts/ReactQueryProvider';
import { queryKeys } from './querykeys';

//const queryClient = new QueryClient();
const formatDate = (date: Date) => {
  return formatISO(date);
};

export const useEventsQuery = (startDate: Date, endDate: Date, userId?: string, enabled: boolean = true) => {
  const endpoint = userId ? '/api/events/my-events' : '/api/events';
  const start = formatDate(startDate);
  const end = formatDate(endDate);

  return useQuery({
    queryKey: queryKeys.events.user(start, end, userId),
    //placeholderData: keepPreviousData,
    queryFn: async () => {
      const result = await fetchGET<IEvent[]>(endpoint, {
        startdate: start,
        enddate: end,
        userId: userId,
      });
      const parsedResult = z.array(SEvent).safeParse(result.data);

      if (!parsedResult.success) {
        throw new QueryError('Invalid event data', 'useEventsQuery', parsedResult.error);
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
  viewType: 'calendar' | 'booking' = 'calendar',
) => {
  const range = getDateRange(action, date, viewType);
  const start = formatDate(range.startDate);
  const end = formatDate(range.endDate);

  return useQuery({
    queryKey: queryKeys.events.user(start, end, userId),
    queryFn: async () => {
      const result = await fetchGET<IEvent[]>('/api/events/my-events', {
        startdate: start,
        enddate: end,
        userId: userId,
      });
      const parsedResult = z.array(SEvent).safeParse(result.data);

      if (!parsedResult.success || !result.data) {
        throw new QueryError('Invalid event data', 'useMyEventsQuery', parsedResult.error);
      }

      return await processEventsAsync({
        events: result.data,
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

export const useEventsByStatusQuery = (startDate: Date, endDate: Date, statusKey: string, enabled: boolean = true) => {
  const start = formatDate(startDate);
  const end = formatDate(endDate);

  return useQuery({
    queryKey: queryKeys.events.status(start, end, statusKey),
    queryFn: async () => {
      const result = await fetchGET<IEvent[]>('/api/events/status', {
        startdate: start,
        enddate: end,
        statusKey: statusKey,
      });
      const parsedResult = z.array(SEvent).safeParse(result.data);

      if (!parsedResult.success) {
        throw new QueryError('Invalid event data', 'useEventsByStatusQuery', parsedResult.error);
      }

      return parsedResult.data;
    },
    enabled: enabled,
  });
};

export const useTotalEventsByStatusQuery = (statusKey: string, startDate?: Date, endDate?: Date, enabled: boolean = true) =>
  useQuery({
    queryKey: queryKeys.events.totalByStatus(statusKey),
    queryFn: async () => {
      const result = await fetchGET<{ total: number }>('/api/events/status/counts', {
        startdate: startDate ? formatDate(startDate) : undefined,
        enddate: endDate ? formatDate(endDate) : undefined,
        statusKey: statusKey,
      });

      if (!result.data) throw new Error('Invalid total events');

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
      const result = await fetchGET<IEvent>(endpoint);
      const parsedResult = SEvent.safeParse(result.data);

      if (!parsedResult.success) {
        throw new QueryError('Invalid event data', 'useEventQuery', parsedResult.error);
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
  userId: z.coerce.number().optional(),
  statusId: z.coerce.number(),
  title: z.string().min(1, 'Title is required'),
  description: z.string(),
  startDate: utcDateSchema,
  endDate: utcDateSchema,
  recurrenceId: z.coerce.number().optional(),
  rule: z.string().optional(),
  ruleDescription: z.string().optional(),
  ruleStartDate: utcDateSchema.optional(),
  ruleEndDate: utcDateSchema.optional(),
  eventRecipients: z.array(z.coerce.number()).optional(),
  eventItems: z.array(z.coerce.number()).optional(),
  eventRooms: z.array(z.coerce.number()).min(1, 'At least one room is required'),
});

export type IEventPUT = z.infer<typeof SEventPUT>;

export const useEventsMutationUpsert = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: IEventPUT) => fetchPUT<IEvent>(`/api/events`, data),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.events.all });
      queryClient.invalidateQueries({
        queryKey: queryKeys.events.detail(response.data?.eventId),
      });
    },
  });
};

export const useEventsMutationCreate = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: IEventPUT) => fetchPOST<IEvent>(`/api/events`, data),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.events.all });
      queryClient.invalidateQueries({
        queryKey: queryKeys.events.detail(response.data?.eventId),
      });
    },
  });
};

export const useEventsMutationDelete = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (eventId: number) => fetchDELETE<null>(`/api/events/${eventId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.events.all });
    },
  });
};

export const SEventPATCH = SEventPUT.partial().extend({
  eventId: z.coerce.number(),
});

export type IEventPATCH = z.infer<typeof SEventPATCH>;

export const useEventPatchMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ data, statusKey }: { data: IEventPATCH; statusKey: TStatusKey }) => {
      return fetchPATCH<IEvent>('/api/events', data);
    },

    /*onMutate: async ({ data, statusKey }) => {
      const eventId = data.eventId;

      // 1. Define the specific detail key
      const detailKey = queryKeys.events.detail(eventId);

      // 2. Cancel outgoing refetches for both Lists and Details
      // We use the partial keys to match ['events', ...] and ['event', ...]
      await queryClient.cancelQueries({ queryKey: queryKeys.events.all });
      await queryClient.cancelQueries({ queryKey: queryKeys.events.details() });

      // 3. Snapshot current state for rollback
      const previousLists = queryClient.getQueriesData({
        queryKey: queryKeys.events.all,
      });
      const previousDetail = queryClient.getQueryData(detailKey);

      // 4. Update the Detail Query (The singular "event" key)
      if (previousDetail) {
        queryClient.setQueryData(detailKey, (old: IEvent) => ({
          ...old,
          ...data,
          status: { ...old.status, key: statusKey },
        }));
      }

      // 5. Update all Range/User/Status Lists (The plural "events" key)
      // This will find and update the event in useEventsQuery and useMyEventsQuery
      queryClient.setQueriesData({ queryKey: queryKeys.events.all }, (old: IEvent) => {
        // If the cached data isn't an array (e.g., total counts), skip it
        if (!Array.isArray(old)) return old;

        return old.map((event: IEvent) => (event.eventId === eventId ? { ...event, ...data, status: { ...event.status, key: statusKey } } : event));
      });

      return { previousLists, previousDetail };
    },

    onError: (err, variables, context) => {
      if (context?.previousDetail) {
        queryClient.setQueryData(queryKeys.events.detail(variables.data.eventId), context.previousDetail);
      }

      if (context?.previousLists) {
        context.previousLists.forEach(([key, value]) => {
          queryClient.setQueryData(key, value);
        });
      }
    },*/

    onSettled: (data, error, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.events.all });
      queryClient.invalidateQueries({
        queryKey: queryKeys.events.detail(variables.data.eventId),
      });
    },
  });
};
