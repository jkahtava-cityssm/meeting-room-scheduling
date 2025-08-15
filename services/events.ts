import { formatISO } from "date-fns";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchPUT, fetchGET, fetchDELETE } from "@/lib/fetch";
import z from "zod/v4";
import { SEvent } from "@/lib/schemas/calendar";

//const queryClient = new QueryClient();

export const useEventsQuery = (startDate: Date, endDate: Date, enabled: boolean = true) =>
  useQuery({
    queryKey: ["events", formatDate(startDate), formatDate(endDate)],
    queryFn: async () =>
      fetchGET("/api/events", {
        startdate: formatDate(startDate),
        enddate: formatDate(endDate),
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
  startDate: Date;
  endDate: Date;
  title: string;
  description?: string;
  recurrenceId?: number;
};

type ruleObject = {
  rule: string;
  ruleStartDate: Date;
  ruleEndDate: Date;
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
