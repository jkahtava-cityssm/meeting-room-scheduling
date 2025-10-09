import { BadRequestMessage, InternalServerErrorMessage, NotFoundMessage, SuccessMessage } from "@/lib/api-helpers";
import { getServerSession, hasServerPermission } from "@/lib/auth";
import { prisma } from "@/prisma";

export async function GET() {
  if (!process.env.DATABASE_URL) {
    return InternalServerErrorMessage("DATABASE_URL Missing");
  }

  const session = await getServerSession();

  if (!session || !hasServerPermission(session, "User", "Read")) {
    return BadRequestMessage("Not Authorized");
  }

  const users = await prisma.user.findMany({
    select: { id: true, name: true, email: true },
    where: { employeeActive: true },
  });

  if (!users) {
    return NotFoundMessage();
  }

  const flatUsers =
    users.map((user) => {
      return {
        userId: user.id,
        name: user.name,
        email: user.email,
      };
    }) || [];

  return SuccessMessage("Collected Users", flatUsers);
}
