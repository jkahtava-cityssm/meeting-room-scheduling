import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchGET, fetchPUT } from '../fetch-client';

import { SUser } from '../schemas';
import { IPermissionSet, IRole, SPermissionSet, SRole } from '../data/permissions';
import z from 'zod/v4';
import { QueryError } from '@/contexts/ReactQueryProvider';
import { queryKeys } from './querykeys';

export const usePermissionsQuery = (enabled: boolean = true) => {
  return useQuery({
    queryKey: queryKeys.permissions.sets(),
    queryFn: async () => {
      const result = await fetchGET<IPermissionSet[]>('/api/admin/permissions');
      const parsedResult = z.array(SPermissionSet).safeParse(result.data);

      if (!parsedResult.success) {
        throw new QueryError('Invalid permissions data', 'usePermissionsQuery', parsedResult.error);
      }

      return parsedResult.data;
    },
    enabled: enabled,
  });
};
const None: IRole = {
  roleId: -1,
  name: 'None',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

export const useRolesQuery = (includeNoneOption: boolean = false, enabled: boolean = true) => {
  const type = includeNoneOption ? 'none' : 'existing';
  return useQuery({
    queryKey: queryKeys.permissions.list(type),
    queryFn: async () => {
      const result = await fetchGET<IRole[]>('/api/admin/permissions/roles');

      if (includeNoneOption) {
        result.data?.unshift(None);
      }

      const parsedResult = z.array(SRole).safeParse(result.data);

      if (!parsedResult.success) {
        throw new QueryError('Invalid roles data', 'useRolesQuery', parsedResult.error);
      }

      return parsedResult.data;
    },
    enabled: enabled,
  });
};

type rolePermissionMutations = {
  roleId: string;
  actionId: string;
  resourceId: string;
  permit: boolean;
};

export const usePermissionMutationUpsert = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: rolePermissionMutations[]) => fetchPUT<null>(`/api/admin/permissions`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.permissions.all });
    },
  });
};

export const SUserWithRoles = SUser.extend({
  roles: z.array(z.object({ roleId: z.number(), name: z.string(), granted: z.union([z.boolean(), z.stringbool()]) })),
});
export type IUserWithRoles = z.infer<typeof SUserWithRoles>;

export const usePermissionUserQuery = (roleId?: string, enabled: boolean = true) => {
  return useQuery({
    queryKey: queryKeys.permissions.userByRole(roleId),
    queryFn: async () => {
      const result = await fetchGET<IUserWithRoles[]>('/api/admin/permissions/users', { roleId: roleId });
      const parsedResult = z.array(SUserWithRoles).safeParse(result.data);

      if (!parsedResult.success) throw new Error(`Invalid user permissions data: ${z.prettifyError(parsedResult.error)}`);

      return parsedResult.data;
    },
    enabled: enabled,
  });
};

export const usePermissionUserRoleMutationUpsert = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { roleId: string; userId: string; assignRole: boolean; roleName: string }) =>
      fetchPUT<null>(`/api/admin/permissions/users`, {
        userId: data.userId,
        roleId: data.roleId,
        assignRole: data.assignRole,
      }),

    onMutate: async (vars) => {
      const key = queryKeys.permissions.userByRole(String(vars.roleId));

      await queryClient.cancelQueries({ queryKey: key });

      const previous = queryClient.getQueryData<IUserWithRoles[]>(key);

      if (previous) {
        queryClient.setQueryData<IUserWithRoles[]>(key, (old) => {
          if (!old) return [];

          return old.map((user) => {
            if (String(user.userId) !== String(vars.userId)) return user;

            const idx = user.roles.findIndex((r) => String(r.roleId) === String(vars.roleId));

            if (idx >= 0) {
              // Update granted flag in place (keep role name as-is)
              const updatedRoles = [...user.roles];
              updatedRoles[idx] = {
                ...updatedRoles[idx],
                granted: vars.assignRole,
              };
              return { ...user, roles: updatedRoles };
            }

            const tempRole = { roleId: Number(vars.roleId), name: vars.roleName, granted: vars.assignRole };

            return { ...user, roles: [...user.roles, tempRole] };
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

    // Always refetch to get canonical data
    onSettled: (_data, _error, vars) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.permissions.userByRole(String(vars.roleId)) });
    },
  });
};
