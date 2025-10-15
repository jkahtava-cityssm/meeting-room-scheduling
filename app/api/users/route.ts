import { guardRoute } from "@/lib/api-guard";
import { NotFoundMessage, SuccessMessage } from "@/lib/api-helpers";
import { prisma } from "@/prisma";
import { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  return guardRoute(
    request,
    [
      { type: "permission", resource: "User", action: "Read" },
      { type: "role", role: "Admin" },
    ],
    async () => {
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
  );
}
