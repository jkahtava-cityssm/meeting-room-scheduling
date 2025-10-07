import { InternalServerErrorMessage, SuccessMessage } from "@/lib/api-helpers";
import { prisma } from "@/prisma";
import { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  if (!process.env.DATABASE_URL) {
    return InternalServerErrorMessage("DATABASE_URL Missing");
  }

  const status = await prisma.status.findMany({
    select: { statusId: true, name: true },
  });

  if (!status) {
    return InternalServerErrorMessage();
  }

  return SuccessMessage("Collected Status", status);
}
