import { BadRequestMessage, InternalServerErrorMessage, SuccessMessage } from "@/lib/api-helpers";
import { getServerSession } from "@/lib/auth";
import { prisma } from "@/prisma";

export async function GET() {
  if (!process.env.DATABASE_URL) {
    return InternalServerErrorMessage("DATABASE_URL Missing");
  }

  const session = await getServerSession();

  if (!session) {
    return BadRequestMessage("Not Authorized");
  }

  const status = await prisma.status.findMany({
    select: { statusId: true, name: true },
  });

  if (!status) {
    return InternalServerErrorMessage();
  }

  return SuccessMessage("Collected Status", status);
}
