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

export const SUserWithRoles = SUser.extend({ roles: z.array(z.object({ roleId: z.number(), role: z.string() })) });

export const usePermissionUserQuery = (roleId?: string, enabled: boolean = true) => {
  return useQuery({
    queryKey: ["users_permissions", roleId],
    queryFn: async () => {
      const result = await fetchGET("/api/admin/permissions/users", { roleId: roleId });
      const parsedResult = z.array(SUserWithRoles).safeParse(result.data);

      if (!parsedResult.success) throw new Error("Invalid User data");

      return parsedResult.data;
    },
    enabled: enabled,
  });
};

export const usePermissionUserRoleMutationUpsert = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { roleId: string; userId: string; assignRole: boolean; roleName: string }) =>
      fetchPUT(`/api/admin/permissions/user`, {
        userId: data.userId,
        roleId: data.roleId,
        assignRole: data.assignRole,
      }),

    onMutate: async (vars) => {
      const key = ["users_permissions", String(vars.roleId)];

      await queryClient.cancelQueries({ queryKey: key });

      // Snapshot previous value
      const previous = queryClient.getQueryData<UserWithRoles[]>(key);

      // If we have the list in cache, optimistically modify it
      if (previous) {
        const userIdStr = String(vars.userId);
        const roleIdStr = String(vars.roleId);

        // Make a shallow copy so we don't mutate cache directly
        const next = [...previous];

        const idx = next.findIndex((u) => String(u.userId) === userIdStr);

        if (vars.assignRole) {
          if (idx === -1) {
            // User wasn't in this role list yet → add a lightweight placeholder row.
            // The server refetch will replace it with full details.
            const placeholder: UserWithRoles = {
              userId: vars.userId,
              roles: [{ roleId: vars.roleId }],
            } as UserWithRoles;
            queryClient.setQueryData<UserWithRoles[]>(key, [...next, placeholder]);
          } else {
            // Ensure the role is present in their roles array
            const user = { ...next[idx], roles: [...next[idx].roles] };
            if (!user.roles.some((r) => String(r.roleId) === roleIdStr)) {
              user.roles.push({ roleId: vars.roleId });
            }
            next[idx] = user;
            queryClient.setQueryData<UserWithRoles[]>(key, next);
          }
        } else {
          // Removing from this role list → remove user entirely
          const filtered = next.filter((u) => String(u.userId) !== userIdStr);
          queryClient.setQueryData<UserWithRoles[]>(key, filtered);
        }
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
