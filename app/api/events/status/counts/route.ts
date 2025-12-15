import { countEvents as countEventsDAL } from "@/lib/data/events";

import { NextRequest } from "next/server";

import { UTCDate } from "@date-fns/utc";

import { BadRequestMessage, InternalServerErrorMessage, SuccessMessage } from "@/lib/api-helpers";
import { guardRoute } from "@/lib/api-guard";
import { format } from "date-fns";

export async function GET(request: NextRequest) {
  return guardRoute(
    request,
    { type: "role", role: "Public" },

    async (userId, roles) => {
      const searchParams = request.nextUrl.searchParams;

      const startDateParam = searchParams.get("startdate");
      const endDateParam = searchParams.get("enddate");
      const statusId = searchParams.get("statusId");

      if (!statusId) {
        return BadRequestMessage();
      }

      const timeClause =
        startDateParam && endDateParam
          ? {
              createdAt: { lte: new UTCDate(endDateParam), gte: new UTCDate(startDateParam) },
            }
          : {};

      const whereClause: import("@prisma/client").Prisma.EventWhereInput = {
        AND: [timeClause, { statusId: Number(statusId) }],
      };
      const total = await countEventsDAL(whereClause);

      if (total === undefined || total === null) {
        return InternalServerErrorMessage();
      }
      //console.log("###########################################");
      //console.log("COUNT RAN: ", format(new Date(), "PPP @ p"));
      //console.log("###########################################");
      return SuccessMessage("Collected Total Events", { total });
    }
  );
}
