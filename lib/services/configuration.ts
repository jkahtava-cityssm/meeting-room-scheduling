import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchGET, fetchPOST, fetchPUT } from "../fetch";
import z from "zod/v4";

import { TConfigurationKeys } from "../types";
import { IConfigurationRecord, SConfigurationEntry, TConfigurationEntry } from "../data/configuration";
import { QueryError } from "@/contexts/ReactQueryProvider";

export const configurationKeys = {
  all: ["configuration"] as const,
  lists: () => [...configurationKeys.all, "list"] as const,
  filtered: (keys?: TConfigurationKeys[]) => [...configurationKeys.lists(), { keys }] as const,
  detail: (key: string) => [...configurationKeys.all, "detail", key] as const,
};

export const useConfigurationQuery = (keys?: TConfigurationKeys[], enabled: boolean = true) => {
  return useQuery({
    queryKey: configurationKeys.filtered(keys),
    queryFn: async () => {
      const result = await fetchGET("/api/configuration", keys ? { keys: keys } : undefined);
      const parsedResult = z.array(SConfigurationEntry).safeParse(result.data);

      if (!parsedResult.success) {
        throw new QueryError("Invalid configuration data", "useEventQuery", parsedResult.error);
      }

      return parsedResult.data;
    },
    enabled: enabled,
  });
};

export const SConfigurationPUT = z.object({
  key: z.coerce.string(),
  value: z.coerce.string(),
  name: z.coerce.string(),
  type: z.enum(["boolean", "number", "string"]),
  description: z.coerce.string(),
});

export type IConfigurationPUT = z.infer<typeof SConfigurationPUT>;

export const useConfigurationMutationUpsert = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: IConfigurationPUT[]) => fetchPUT(`/api/configuration`, data),
    onMutate: async (newData) => {
      const key = configurationKeys.all;

      await queryClient.cancelQueries({ queryKey: key });

      const previousConfig = queryClient.getQueryData(key);

      if (previousConfig) {
        queryClient.setQueryData<IConfigurationPUT[]>(key, (old) => {
          if (!old) return [];

          return old.map((setting) => {
            const matchedSetting = newData.find((newData) => newData.key === setting.key);

            return matchedSetting ? { ...setting, ...matchedSetting } : setting;
          });
        });
      }

      return { previousConfig };
    },

    onError: (err, newData, context) => {
      queryClient.setQueryData(configurationKeys.all, context?.previousConfig);
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: configurationKeys.all });
    },
  });
};
