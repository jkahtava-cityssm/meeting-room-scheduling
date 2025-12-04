import { guardRoute } from "@/lib/api-guard";
import { NotFoundMessage, SuccessMessage } from "@/lib/api-helpers";
import { prisma } from "@/prisma";
import { findManyUsers } from "@/lib/data/users";
import { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  return guardRoute(
    request,
    { type: "permission", resource: "User", action: "Read" },

    async () => {
      const users = await findManyUsers({ employeeActive: true });

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
