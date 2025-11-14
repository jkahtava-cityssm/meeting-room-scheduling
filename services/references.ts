import { fetchGET } from "@/lib/fetch";
import { IStatus, SStatus } from "@/lib/schemas/calendar";
import { useQuery } from "@tanstack/react-query";
import z from "zod/v4";

const AllStatus: IStatus = {
  statusId: -1,
  name: "Any Status",
  icon: "asterisk",
  color: "zinc",
};

export const useStatusQuery = (includeAllOption: boolean = false, enabled: boolean = true) =>
  useQuery({
    queryKey: ["status", includeAllOption ? "all" : "existing"],
    queryFn: async () =>
      fetchGET(`/api/references/status`, undefined, 180, ["status"]).then((result) => {
        if (includeAllOption) {
          result.data.unshift(AllStatus);
        }

        const parsedResult = z.array(SStatus).safeParse(result.data);

        if (!parsedResult.success) throw new Error("Invalid status data");

        return parsedResult.data;
      }),
    enabled: enabled,
  });
