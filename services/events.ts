import { formatISO } from "date-fns";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getFetch, putFetch } from "@/lib/fetch";
import z from "zod/v4";
import { SEvent } from "@/lib/schemas/calendar";

//const queryClient = new QueryClient();

export const useEventsQuery = (startDate: Date, endDate: Date) =>
  useQuery({
    queryKey: ["events", formatDate(startDate), formatDate(endDate)],
    queryFn: async () =>
      getFetch("/api/events", {
        startdate: formatDate(startDate),
        enddate: formatDate(endDate),
      }),
  });

const formatDate = (date: Date) => {
  return formatISO(date);
};

export const useEventQuery = (eventId: number | undefined, enabled: boolean = true) =>
  useQuery({
    queryKey: ["event", eventId],
    queryFn: async () =>
      getFetch(`/api/events/${eventId}`).then((data) => {
        const result = z.array(SEvent).safeParse(data);

        if (!result.success) throw new Error("Invalid event data");

        return result.data[0];
      }),
    enabled: enabled && eventId !== undefined,
    staleTime: 2000,
  });

type eventObject = {
  eventId: number;
  roomId: number;
  startDate: Date;
  endDate: Date;
  title: string;
  description: string;
  recurrenceId: number | null;
};

type ruleObject = {
  rule: string;
  ruleStartDate: Date;
  ruleEndDate: Date;
};

export type mutationObject = {
  eventData: eventObject;
  ruleData: ruleObject | null;
};

export const useEventsMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: mutationObject) => putFetch(`/api/events`, data),
    onSuccess: (response) => {
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: ["events"] });
      queryClient.invalidateQueries({ queryKey: ["event", response.data.eventId] });
    },
  });
};
