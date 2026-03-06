import { QueryError } from "@/contexts/ReactQueryProvider";
import { fetchGET } from "@/lib/fetch";
import { SEvent, SUser } from "@/lib/schemas/calendar";
import { useQuery } from "@tanstack/react-query";
import z from "zod/v4";

export const useUsersQuery = (enabled: boolean = true) =>
  useQuery({
    queryKey: ["users"],
    queryFn: async () => {
      const result = await fetchGET(`/api/users`, undefined, 180, ["users"]);
      const parsedResult = z.array(SUser).safeParse(result.data);

      if (!parsedResult.success) {
        throw new QueryError("Invalid user data", "useUsersQuery", parsedResult.error);
      }

      return parsedResult.data;
    },
    enabled: enabled,
  });

export const useUserEventsQuery = (userId: string | undefined, enabled: boolean = true) =>
  useQuery({
    queryKey: ["user_events", userId],
    queryFn: async () => {
      const result = await fetchGET(`/api/users/${userId}/events`);

      const parsedResult = z.array(SEvent).safeParse(result.data);

      if (!parsedResult.success) {
        throw new QueryError("Invalid user event data", "useUserEventsQuery", parsedResult.error);
      }

      return parsedResult.data;
    },
    enabled: enabled,
  });
