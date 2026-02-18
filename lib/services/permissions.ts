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

export const usePermissionUserQuery = (roleId: string, enabled: boolean = true) => {
  return useQuery({
    queryKey: ["users_permissions", roleId],
    queryFn: async () => {
      const result = await fetchGET("/api/admin/permissions/users", { roleId: roleId });
      const parsedResult = z.array(SUser).safeParse(result.data);

      if (!parsedResult.success) throw new Error("Invalid User data");

      return parsedResult.data;
    },
    enabled: enabled,
  });
};
