import { BadRequestMessage, InternalServerErrorMessage, SuccessMessage } from "@/lib/api-helpers";
import { getServerSession } from "@/lib/auth";
import { prisma } from "@/prisma";
import { findManyStatus } from "@/lib/data/status";

export async function GET() {
  if (!process.env.DATABASE_URL) {
    return InternalServerErrorMessage("DATABASE_URL Missing");
  }

  const session = await getServerSession();

  if (!session) {
    return BadRequestMessage("Not Authorized");
  }

  const status = await findManyStatus();

  if (!status) {
    return InternalServerErrorMessage();
  }

  return SuccessMessage("Collected Status", status);
}
