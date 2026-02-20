import { useQuery } from "@tanstack/react-query";
import { fetchGET } from "../fetch";
import z from "zod/v4";

import { TConfigurationKeys } from "../types";
import { SConfiguration } from "../data/configuration";

export const useConfigurationQuery = (keys: TConfigurationKeys[], enabled: boolean = true) => {
  return useQuery({
    queryKey: ["configuration"],
    queryFn: async () => {
      const result = await fetchGET("/api/configuration", { keys: keys });
      const parsedResult = z.array(SConfiguration).safeParse(result.data);

      if (!parsedResult.success) throw new Error("Invalid configuration data");

      return parsedResult.data;
    },
    enabled: enabled,
  });
};
