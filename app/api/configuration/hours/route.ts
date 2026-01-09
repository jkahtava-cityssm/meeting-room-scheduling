import { findManyConfiguration } from "@/lib/data/configuration";

import { NextRequest } from "next/server";
import { InternalServerErrorMessage, SuccessMessage, validateVisibleHours } from "@/lib/api-helpers";
import { guardRoute } from "@/lib/api-guard";

export async function GET(request: NextRequest) {
  return guardRoute(request, { IsPublic: { type: "role", role: "Public" } }, async () => {
    const config = await findManyConfiguration(["visibleHoursStart", "visibleHoursEnd"]);

    if (!config) {
      return InternalServerErrorMessage();
    }

    const { visibleHoursStart, visibleHoursEnd } = validateVisibleHours(
      Number(config.visibleHoursStart),
      Number(config.visibleHoursEnd)
    );

    return SuccessMessage("Collected Hours", { from: visibleHoursStart, to: visibleHoursEnd });
  });
}
