import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchGET, fetchPUT } from '../fetch-client';
import z from 'zod/v4';

import { CONFIG_MANIFEST, TConfigurationKeys, TConfigurationRecord } from '../types';
import { ConfigurationMap, IConfigurationRecord, SConfigurationEntry, TConfigurationEntry } from '../data/configuration';
import { QueryError } from '@/contexts/ReactQueryProvider';
import { queryKeys } from './querykeys';

export const useConfigurationQuery = <K extends TConfigurationKeys = TConfigurationKeys>(keys?: readonly K[], enabled: boolean = true) => {
  return useQuery({
    queryKey: queryKeys.configuration.filtered(keys ? [...keys] : undefined),
    queryFn: async (): Promise<Array<IConfigurationRecord<K>>> => {
      const result = await fetchGET<unknown[]>('/api/configuration', keys ? { keys: [...keys] } : undefined);
      const parsedResult = z.array(SConfigurationEntry).safeParse(result.data);

      if (!parsedResult.success) {
        throw new QueryError('Invalid configuration data', 'useConfigurationQuery', parsedResult.error);
      }

      return parsedResult.data as Array<IConfigurationRecord<K>>;
    },
    enabled,
  });
};

export const usePrivateConfigurationQuery = <K extends TConfigurationKeys = TConfigurationKeys>(keys?: readonly K[], enabled: boolean = true) => {
  return useQuery({
    queryKey: queryKeys.configuration.filtered(keys ? [...keys] : undefined),
    queryFn: async (): Promise<Pick<ConfigurationMap, K>> => {
      const result = await fetchGET<unknown[]>('/api/configuration', keys ? { keys: [...keys] } : undefined);
      const parsedResult = z.array(SConfigurationEntry).safeParse(result.data);

      if (!parsedResult.success) {
        throw new QueryError('Invalid configuration data', 'usePrivateConfigurationQuery', parsedResult.error);
      }

      // 1. Build default values object
      const defaults = Object.fromEntries(CONFIG_MANIFEST.map((m) => [m.key, m.defaultValue])) as ConfigurationMap;

      // 2. Build overrides object from API response
      const overrides = Object.fromEntries(parsedResult.data.map((entry) => [entry.key, entry.value]));

      // 3. Combine defaults and overrides
      const configMap = {
        ...defaults,
        ...overrides,
      } as ConfigurationMap;

      // Filter keys if specified, otherwise return full configuration map
      if (keys && keys.length > 0) {
        const filteredMap = {} as Pick<ConfigurationMap, K>;
        for (const key of keys) {
          filteredMap[key] = configMap[key];
        }
        return filteredMap;
      }

      return configMap as Pick<ConfigurationMap, K>;
    },
    enabled,
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
    mutationFn: async (data: IConfigurationPUT[]) => fetchPUT<IConfigurationPUT[]>(`/api/configuration`, data),
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
