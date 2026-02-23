import { useQuery } from "@tanstack/react-query";
import { fetchGET } from "../fetch";
import z from "zod/v4";

import { TConfigurationKeys } from "../types";
import { SConfigurationEntry } from "../data/configuration";

export const useConfigurationQuery = (keys?: TConfigurationKeys[], enabled: boolean = true) => {
  return useQuery({
    queryKey: ["configuration", keys],
    queryFn: async () => {
      const result = await fetchGET("/api/configuration", keys ? { keys: keys } : undefined);
      const parsedResult = z.array(SConfigurationEntry).safeParse(result.data);

      if (!parsedResult.success) throw new Error("Invalid configuration data");

      return parsedResult.data;
    },
    enabled: enabled,
  });
};
