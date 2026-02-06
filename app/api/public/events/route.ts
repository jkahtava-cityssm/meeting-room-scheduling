import { findPublicManyEvents } from "@/lib/data/events";

import { NextRequest } from "next/server";
import { BadRequestMessage, InternalServerErrorMessage, SuccessMessage } from "@/lib/api-helpers";
import { UTCDate } from "@date-fns/utc";
import { TStatusKey } from "@/lib/types";
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;

  const startDateParam = searchParams.get("startdate");
  const endDateParam = searchParams.get("enddate");

  if (!startDateParam || !endDateParam) {
    return BadRequestMessage();
  }

  const StartDate: UTCDate = new UTCDate(startDateParam);
  const EndDate: UTCDate = new UTCDate(endDateParam);

  const events = await findPublicManyEvents({
    AND: [
      {
        OR: [
          {
            startDate: { lte: EndDate },
            endDate: { gte: StartDate },
          },
          {
            recurrence: {
              startDate: { lte: EndDate },
              endDate: { gte: StartDate },
            },
          },
        ],
        AND: [{ OR: [{ status: { key: "APPROVED" as TStatusKey } }, { status: { key: "PENDING" as TStatusKey } }] }],
      },
    ],
  });

  if (!events) {
    return InternalServerErrorMessage();
  }

  return SuccessMessage("Collected Events", events);
}
