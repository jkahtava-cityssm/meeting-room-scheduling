import { QueryError } from "@/contexts/ReactQueryProvider";
import { fetchGET } from "@/lib/fetch";
import { IStatus, SStatus } from "@/lib/schemas/calendar";
import { useQuery } from "@tanstack/react-query";
import z from "zod/v4";

const AllStatus: IStatus = {
  statusId: -1,
  key: "ALL",
  name: "Any Status",
  icon: "Asterisk",
  color: "zinc",
};

export const useStatusQuery = (includeAllOption: boolean = false, enabled: boolean = true) =>
  useQuery({
    queryKey: ["status", includeAllOption ? "all" : "existing"],
    queryFn: async () => {
      const result = await fetchGET(`/api/references/status`, undefined, 180, ["status"]);

      if (includeAllOption) {
        result.data.unshift(AllStatus);
      }

      const parsedResult = z.array(SStatus).safeParse(result.data);

      if (!parsedResult.success) {
        throw new QueryError("Invalid status data", "useStatusQuery", parsedResult.error);
      }

      return parsedResult.data;
    },
    enabled: enabled,
  });
