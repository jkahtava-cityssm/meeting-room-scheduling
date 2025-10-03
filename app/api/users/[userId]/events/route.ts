import { prisma } from "@/prisma";

import { NextRequest, NextResponse } from "next/server";

import { UTCDate } from "@date-fns/utc";

import { BadRequestMessage, InternalServerErrorMessage, SuccessMessage } from "@/lib/api-helpers";

export async function GET(req: NextRequest, { params }: { params: Promise<{ userId: string }> }) {
  if (!process.env.DATABASE_URL) {
    return InternalServerErrorMessage("DATABASE_URL Missing");
  }

  const { userId } = await params;

  if (!userId) {
    return BadRequestMessage();
  }
  /*
  const searchParams = req.nextUrl.searchParams;

  const startDateParam = searchParams.get("startdate");
  const endDateParam = searchParams.get("enddate");

  if (!startDateParam || !endDateParam) {
    return BadRequestMessage();
  }*/

  //const StartDate: UTCDate = new UTCDate(startDateParam);
  //const EndDate: UTCDate = new UTCDate(endDateParam);

  const events = await prisma.event.findMany({
    include: { room: true, recurrence: true },
    where: {
      userId: Number(userId),
      /*OR: [
        { startDate: { lte: EndDate }, endDate: { gte: StartDate } },
        { recurrence: { startDate: { lte: EndDate }, endDate: { gte: StartDate } } },
      ],*/
    },
  });

  if (!events) {
    return InternalServerErrorMessage();
  }

  return SuccessMessage("Collected Events", events);
}
