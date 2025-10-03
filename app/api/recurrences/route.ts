import { BadRequestMessage, CreatedMessage, InternalServerErrorMessage, SuccessMessage } from "@/lib/api-helpers";
import { prisma } from "@/prisma";
import { parseISO } from "date-fns";

import { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  if (!process.env.DATABASE_URL) {
    return InternalServerErrorMessage("DATABASE_URL Missing");
  }
  const searchParams = req.nextUrl.searchParams;

  const startDateParam = searchParams.get("startdate");
  const endDateParam = searchParams.get("enddate");

  if (!startDateParam || !endDateParam) {
    return BadRequestMessage();
  }

  const StartDate: Date = parseISO(startDateParam);
  const EndDate: Date = parseISO(endDateParam);

  const events = await prisma.event.findMany({
    include: { room: true, recurrence: true },
    where: {
      recurrence: { startDate: { lte: EndDate }, endDate: { gte: StartDate } },
    },
  });

  if (!events) {
    return InternalServerErrorMessage();
  }

  return SuccessMessage("Collected Events", events);
}

export async function POST(req: Request) {
  if (!process.env.DATABASE_URL) {
    return InternalServerErrorMessage("DATABASE_URL Missing");
  }

  const { startDate, endDate, rule } = await req.json();

  if (!startDate || !endDate || !rule) {
    return BadRequestMessage();
  }

  const result = await prisma.recurrence.create({
    data: { startDate, endDate, rule },
  });

  if (!result) {
    InternalServerErrorMessage();
  }

  return CreatedMessage("Created Reccurrence", result);
}
