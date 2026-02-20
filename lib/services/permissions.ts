import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { formatISO } from "date-fns";
import { fetchGET, fetchPUT } from "../fetch";
import { useSession } from "../auth-client";
import { SStatus, SUser } from "../schemas/calendar";
import { SPermissionSet, SRole } from "../data/permissions";
import z from "zod/v4";

const formatDate = (date: Date) => {
  return formatISO(date);
};

export const usePermissionsQuery = (enabled: boolean = true) => {
  return useQuery({
    queryKey: ["permissions"],
    queryFn: async () => {
      const result = await fetchGET("/api/admin/permissions");
      const parsedResult = z.array(SPermissionSet).safeParse(result.data);

      if (!parsedResult.success) throw new Error("Invalid status data");

      return parsedResult.data;
    },
    enabled: enabled,
  });
};

export const useRolesQuery = (enabled: boolean = true) => {
  return useQuery({
    queryKey: ["roles"],
    queryFn: async () => {
      const result = await fetchGET("/api/admin/permissions/roles");
      const parsedResult = z.array(SRole).safeParse(result.data);

      if (!parsedResult.success) throw new Error("Invalid status data");

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
    mutationFn: async (data: rolePermissionMutations[]) => fetchPUT(`/api/admin/permissions`, data),
    onSuccess: (response) => {
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: ["permissions"] });
      queryClient.invalidateQueries({ queryKey: ["roles"] });
    },
  });
};

export const SUserWithRoles = SUser.extend({ roles: z.array(z.object({ roleId: z.number(), name: z.string() })) });
export type IUserWithRoles = z.infer<typeof SUserWithRoles>;

export const usePermissionUserQuery = (roleId?: string, enabled: boolean = true) => {
  return useQuery({
    queryKey: ["users_permissions", roleId],
    queryFn: async () => {
      const result = await fetchGET("/api/admin/permissions/users", { roleId: roleId });
      const parsedResult = z.array(SUserWithRoles).safeParse(result.data);

      if (!parsedResult.success) throw new Error(`Invalid User data: ${z.prettifyError(parsedResult.error)}`);

      return parsedResult.data;
    },
    enabled: enabled,
  });
};

export const usePermissionUserRoleMutationUpsert = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { roleId: string; userId: string; assignRole: boolean; roleName: string }) =>
      fetchPUT(`/api/admin/permissions/users`, {
        userId: data.userId,
        roleId: data.roleId,
        assignRole: data.assignRole,
      }),

    onMutate: async (vars) => {
      const key = ["users_permissions", String(vars.roleId)];

      await queryClient.cancelQueries({ queryKey: key });

      const previous = queryClient.getQueryData<IUserWithRoles[]>(key);

      if (previous) {
        queryClient.setQueryData<IUserWithRoles[]>(key, (old) => {
          if (!old) return [];

          return old.map((user) => {
            if (String(user.userId) !== String(vars.userId)) return user;

            const otherRoles = user.roles.filter((r) => String(r.roleId) !== String(vars.roleId));
            const updatedRoles = vars.assignRole
              ? [...otherRoles, { roleId: Number(vars.roleId), name: vars.roleName }]
              : otherRoles;

            return { ...user, roles: updatedRoles };
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
      queryClient.invalidateQueries({ queryKey: ["users_permissions", String(vars.roleId)] });
    },
  });
};
