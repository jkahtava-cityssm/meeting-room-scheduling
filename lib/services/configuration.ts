import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchGET, fetchPOST, fetchPUT } from "../fetch";
import z from "zod/v4";

import { TConfigurationKeys } from "../types";
import { SConfigurationEntry, TConfigurationEntry } from "../data/configuration";

export const useConfigurationQuery = (keys?: TConfigurationKeys[], enabled: boolean = true) => {
  return useQuery({
    queryKey: ["configuration", keys],
    queryFn: async () => {
      const result = await fetchGET("/api/configuration", keys ? { keys: keys } : undefined);
      const parsedResult = z.array(SConfigurationEntry).safeParse(result.data);

      if (!parsedResult.success) throw new Error("Invalid configuration data");

      return parsedResult.data;
    },
    enabled: enabled,
  });
};

export const useMutateConfiguration = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { key: string; value: string }) =>
      fetchPUT(`/api/configuration`, {
        key: data.key,
        value: data.value,
      }),

    onMutate: async (variables) => {
      const key = ["configuration", variables.key];

      await queryClient.cancelQueries({ queryKey: key });

      const previous = queryClient.getQueryData<TConfigurationEntry[]>(key);

      if (previous) {
        queryClient.setQueryData<TConfigurationEntry[]>(key, (old) => {
          if (!old) return undefined;

          return old.map((entry) => {
            if (entry.key !== variables.key) return entry;

            const newValue =
              entry.type === "boolean"
                ? Boolean(variables.value)
                : entry.type === "number"
                  ? Number(variables.value)
                  : String(variables.value);

            return { ...entry, value: newValue } as TConfigurationEntry;
          });
        });
      }

      // Return context with previous snapshot for rollback
      return { previous, key };
    },

    // Rollback on error
    onError: (_error, _vars, ctx) => {
      if (ctx?.previous) {
        queryClient.setQueryData(ctx.key, ctx.previous);
      }
    },

    onSettled: (_data, _error, variables) => {
      queryClient.invalidateQueries({ queryKey: ["configuration", variables.key] });
    },
  });
};
