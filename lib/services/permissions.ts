import { useQuery } from "@tanstack/react-query";
import { formatISO } from "date-fns";
import { fetchGET } from "../fetch";
import { useSession } from "../auth-client";
import { SStatus } from "../schemas/calendar";
import { SRole } from "../data/permissions";
import z from "zod/v4";

const formatDate = (date: Date) => {
  return formatISO(date);
};

export const useRolesQuery = (enabled: boolean = true) => {
  const session = useSession();
  return useQuery({
    queryKey: ["roles"],
    queryFn: async () => {
      const result = await fetchGET("/api/admin/permissions");
      const parsedResult = z.array(SRole).safeParse(result.data);

      if (!parsedResult.success) throw new Error("Invalid status data");

      return parsedResult.data;
    },
    enabled: enabled,
  });
};
