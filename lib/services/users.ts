import { QueryError } from '@/contexts/ReactQueryProvider';
import { fetchDELETE, fetchGET, fetchPOST, fetchPUT } from '@/lib/fetch-client';
import { SEvent, SUser } from '@/lib/schemas';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import z from 'zod/v4';
import { queryKeys } from './querykeys';

export const useUsersQuery = (onlyActive: boolean = true, enabled: boolean = true) =>
  useQuery({
    queryKey: queryKeys.users.lists(),
    queryFn: async () => {
      const result = await fetchGET(`/api/users`, { onlyActive }, 180, ['users']);
      const parsedResult = z.array(SUser).safeParse(result.data);

      if (!parsedResult.success) {
        throw new QueryError('Invalid user data', 'useUsersQuery', parsedResult.error);
      }

      return parsedResult.data;
    },
    enabled: enabled,
  });

export const useUserQuery = (userId: number | undefined, enabled: boolean = true) =>
  useQuery({
    queryKey: queryKeys.users.detail(userId),
    queryFn: async () => {
      const result = await fetchGET(`/api/users/${userId}`);

      const parsedResult = z.array(SUser).safeParse(result.data);

      if (!parsedResult.success) {
        throw new QueryError('Invalid room data', 'useUserQuery', parsedResult.error);
      }

      return parsedResult.data[0];
    },
    enabled: enabled && userId !== undefined,
    gcTime: 0,
    staleTime: 0,
  });

export const SUserPUT = z.object({
  userId: z.coerce.number().optional(),
  name: z.string().min(1, 'Name is required'),
  email: z.string(),
  emailEnabled: z.union([z.boolean(), z.stringbool()]),
  department: z.string().optional(),
  jobTitle: z.string().optional(),
  externalId: z.string().optional(),
  isActive: z.union([z.boolean(), z.stringbool()]),
  isManaged: z.union([z.boolean(), z.stringbool()]),
});

export type IUserPUT = z.infer<typeof SUserPUT>;

export const useUsersMutationUpsert = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: IUserPUT) => fetchPUT(`/api/users`, data),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.users.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.users.detail(response.data.userId) });
    },
  });
};

export const useUsersMutationDelete = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (userId: number) => fetchDELETE(`/api/users/${userId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.users.all });
    },
  });
};

export const useUsersMutationCreate = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: IUserPUT) => fetchPOST(`/api/users`, data),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.users.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.users.detail(response.data.userId) });
    },
  });
};
