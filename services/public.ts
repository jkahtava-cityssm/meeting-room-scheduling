import { fetchGET } from "@/lib/fetch";
import { useQuery } from "@tanstack/react-query";
import { formatISO } from "date-fns";

const formatDate = (date: Date) => {
  return formatISO(date);
};

export const usePublicEventsQuery = (startDate: Date, endDate: Date, enabled: boolean = true) =>
  useQuery({
    queryKey: ["events", formatDate(startDate), formatDate(endDate)],
    queryFn: async () =>
      fetchGET("/api/public/events", {
        startdate: formatDate(startDate),
        enddate: formatDate(endDate),
      }).then((result) => {
        return result.data;
      }),
    enabled: enabled,
  });

export const usePublicRoomsQuery = (enabled: boolean = true) =>
  useQuery({
    queryKey: ["rooms"],
    queryFn: async () =>
      fetchGET("/api/public/rooms", {}).then((result) => {
        return result.data;
      }),
    enabled: enabled,
    staleTime: 1000 * 60 * 60, // 1 hour
  });
