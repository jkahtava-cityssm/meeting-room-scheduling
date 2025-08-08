import { InternalServerErrorMessage, NotFoundMessage, SuccessMessage } from "@/lib/api-helpers";
import { prisma } from "@/prisma";

export async function GET() {
  if (!process.env.DATABASE_URL) {
    return InternalServerErrorMessage("DATABASE_URL Missing");
  }

  const members = await prisma.member.findMany({
    select: { memberId: true, user: { select: { name: true, email: true } } },
  });

  if (!members) {
    return NotFoundMessage();
  }

  const flatMembers =
    members.map((member) => {
      return {
        memberId: member.memberId,
        name: member.user.name,
        email: member.user.email,
      };
    }) || [];

  return SuccessMessage("Collected Members", flatMembers);
}
