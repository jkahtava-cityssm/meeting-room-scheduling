import { fetchGET } from "@/lib/fetch";
import { SUser } from "@/lib/schemas/calendar";
import { useQuery } from "@tanstack/react-query";
import z from "zod/v4";

export const useUsersQuery = (enabled: boolean = true) =>
  useQuery({
    queryKey: ["users"],
    queryFn: async () =>
      fetchGET(`/api/users`, undefined, 180).then((result) => {
        const parsedResult = z.array(SUser).safeParse(result.data);

        if (!parsedResult.success) throw new Error("Invalid user data");

        return parsedResult.data;
      }),
    enabled: enabled,
  });
