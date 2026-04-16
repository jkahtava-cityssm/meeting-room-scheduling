import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchGET, fetchPOST, fetchPUT } from '../fetch';
import z from 'zod/v4';

import { CONFIG_MANIFEST, TConfigurationKeys, TConfigurationRecord } from '../types';
import { SConfigurationEntry } from '../data/configuration';
import { QueryError } from '@/contexts/ReactQueryProvider';
import { queryKeys } from './querykeys';

export const useConfigurationQuery = (keys?: TConfigurationKeys[], enabled: boolean = true) => {
  return useQuery({
    queryKey: queryKeys.configuration.filtered(keys),
    queryFn: async () => {
      const result = await fetchGET('/api/configuration', keys ? { keys: keys } : undefined);
      const parsedResult = z.array(SConfigurationEntry).safeParse(result.data);

      if (!parsedResult.success) {
        throw new QueryError('Invalid configuration data', 'useConfigurationQuery', parsedResult.error);
      }

      return parsedResult.data;
    },
    enabled: enabled,
  });
};

export const usePrivateConfigurationQuery = (keys?: TConfigurationKeys[], enabled: boolean = true) => {
  return useQuery({
    queryKey: queryKeys.configuration.filtered(keys),
    queryFn: async () => {
      const result = await fetchGET('/api/configuration', keys ? { keys: keys } : undefined);
      const parsedResult = z.array(SConfigurationEntry).safeParse(result.data);

      if (!parsedResult.success) {
        throw new QueryError('Invalid configuration data', 'usePrivateConfigurationQuery', parsedResult.error);
      }

      const defaults = Object.fromEntries(CONFIG_MANIFEST.map((m) => [m.key, m.defaultValue])) as TConfigurationRecord;

      const overrides = Object.fromEntries(parsedResult.data.map((entry) => [entry.key, entry.value]));

      const configMap: TConfigurationRecord = {
        ...defaults,
        ...overrides,
      };

      return configMap;
    },
    enabled: enabled,
  });
};

export const SConfigurationPUT = z.object({
  key: z.coerce.string(),
  value: z.coerce.string(),
  name: z.coerce.string(),
  type: z.enum(['boolean', 'number', 'string']),
  description: z.coerce.string(),
});

export type IConfigurationPUT = z.infer<typeof SConfigurationPUT>;

export const useConfigurationMutationUpsert = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: IConfigurationPUT[]) => fetchPUT(`/api/configuration`, data),
    onMutate: async (newData) => {
      const key = queryKeys.configuration.all;

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
      queryClient.setQueryData(queryKeys.configuration.all, context?.previousConfig);
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.configuration.all });
    },
  });
};
