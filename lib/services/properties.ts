import { useQuery } from "@tanstack/react-query";
import { fetchGET } from "../fetch";
import z from "zod/v4";
import { SProperty } from "../schemas/calendar";
import { QueryError } from "@/contexts/ReactQueryProvider";
import { queryKeys } from "./querykeys";

export const usePropertyQuery = (enabled: boolean = true) =>
  useQuery({
    queryKey: queryKeys.references.properties(),
    queryFn: async () => {
      const result = await fetchGET("/api/references/properties");

      const parsedResult = z.array(SProperty).safeParse(result.data);

      if (!parsedResult.success) {
        throw new QueryError("Invalid property data", "usePropertyQuery", parsedResult.error);
      }

      return parsedResult.data;
    },
    enabled: enabled,
    //staleTime: 0,
    staleTime: 1000 * 60 * 60, // 1 hour
  });
