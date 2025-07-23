import { formatISO } from "date-fns";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getFetch, putFetch } from "@/lib/fetch";

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
