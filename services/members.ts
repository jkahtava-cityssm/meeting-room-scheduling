import { fetchGET } from "@/lib/fetch";
import { SMember } from "@/lib/schemas/calendar";
import { useQuery } from "@tanstack/react-query";
import z from "zod/v4";

export const useMembersQuery = (enabled: boolean = true) =>
  useQuery({
    queryKey: ["members"],
    queryFn: async () =>
      fetchGET(`/api/members`, undefined, 180).then((result) => {
        const parsedResult = z.array(SMember).safeParse(result.data);

        if (!parsedResult.success) throw new Error("Invalid member data");

        return parsedResult.data;
      }),
    enabled: enabled,
  });
