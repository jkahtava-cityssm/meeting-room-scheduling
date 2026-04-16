import { useQuery } from '@tanstack/react-query';
import { fetchGET } from '../fetch';
import z from 'zod/v4';
import { SItem } from '../schemas';
import { QueryError } from '@/contexts/ReactQueryProvider';
import { queryKeys } from './querykeys';

export const useItemsQuery = (enabled: boolean = true) =>
  useQuery({
    queryKey: queryKeys.references.items(),
    queryFn: async () => {
      const result = await fetchGET('/api/references/items');

      const parsedResult = z.array(SItem).safeParse(result.data);

      if (!parsedResult.success) {
        throw new QueryError('Invalid item data', 'useItemsQuery', parsedResult.error);
      }

      return parsedResult.data;
    },
    enabled: enabled,
    //staleTime: 0,
    staleTime: 1000 * 60 * 60, // 1 hour
  });
