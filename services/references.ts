import { fetchGET } from "@/lib/fetch";
import { SStatus } from "@/lib/schemas/calendar";
import { useQuery } from "@tanstack/react-query";
import z from "zod/v4";

export const useStatusQuery = (enabled: boolean = true) =>
  useQuery({
    queryKey: ["status"],
    queryFn: async () =>
      fetchGET(`/api/references/status`).then((result) => {
        const parsedResult = z.array(SStatus).safeParse(result.data);

        if (!parsedResult.success) throw new Error("Invalid status data");

        return parsedResult.data;
      }),
    enabled: enabled,
    gcTime: 0,
    staleTime: 0,
  });
