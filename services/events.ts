import { formatISO } from "date-fns";

import { useQuery } from "@tanstack/react-query";
import { getFetch } from "@/lib/fetch";

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
  return formatISO(date, { representation: "date" });
};
