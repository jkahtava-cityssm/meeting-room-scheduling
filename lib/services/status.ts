import { QueryError } from '@/contexts/ReactQueryProvider';
import { fetchGET } from '@/lib/fetch-client';
import { IStatus, SStatus } from '@/lib/schemas';
import { useQuery } from '@tanstack/react-query';
import z from 'zod/v4';
import { queryKeys } from './querykeys';

const AllStatus: IStatus = {
  statusId: -1,
  key: 'ALL',
  name: 'Any Status',
  icon: 'asterisk',
  color: 'zinc',
};

export const useStatusQuery = (includeAllOption: boolean = false, enabled: boolean = true) => {
  const type = includeAllOption ? 'all' : 'existing';
  return useQuery({
    queryKey: queryKeys.references.statusList(type),
    queryFn: async () => {
      const result = await fetchGET(`/api/references/status`, undefined, 180, ['status']);

      if (includeAllOption) {
        result.data.unshift(AllStatus);
      }

      const parsedResult = z.array(SStatus).safeParse(result.data);

      if (!parsedResult.success) {
        throw new QueryError('Invalid status data', 'useStatusQuery', parsedResult.error);
      }

      return parsedResult.data;
    },
    enabled: enabled,
  });
};
