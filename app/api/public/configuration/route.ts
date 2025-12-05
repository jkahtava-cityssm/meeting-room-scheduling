import { prisma } from "@/prisma";
import { findManyConfiguration } from "@/lib/data/configuration";

import { NextRequest } from "next/server";
import { InternalServerErrorMessage, SuccessMessage, validateVisibleHours } from "@/lib/api-helpers";

export async function GET(req: NextRequest) {
  const configEntries = await findManyConfiguration({ OR: [{ key: "visibleHoursStart" }, { key: "visibleHoursEnd" }] });

  if (!configEntries) {
    return InternalServerErrorMessage();
  }

  type VisibleKey = "visibleHoursStart" | "visibleHoursEnd";

  const config = configEntries.reduce<Record<VisibleKey, number>>(
    (acc, entry) => {
      const key = entry.key as VisibleKey;
      acc[key] = Number(entry.value);
      return acc;
    },
    { visibleHoursStart: 0, visibleHoursEnd: 0 }
  );

  const { visibleHoursStart, visibleHoursEnd } = validateVisibleHours(config.visibleHoursStart, config.visibleHoursEnd);

  const visibleHoursRange = { from: visibleHoursStart, to: visibleHoursEnd };

  return SuccessMessage("Collected Hours", visibleHoursRange);
}
