import { guardRoute } from "@/lib/api-guard";
import { NotFoundMessage, SuccessMessage } from "@/lib/api-helpers";
import { prisma } from "@/prisma";
import { findManyUsers } from "@/lib/data/users";
import { NextRequest } from "next/server";
import { isGroupRequirementMet } from "@/lib/auth-permission-checks";

export async function GET(request: NextRequest) {
  return guardRoute(
    request,
    {
      AnyOf: [
        {
          ReadAll: { type: "permission", resource: "User", action: "Read All" },
          ReadSelf: { type: "permission", resource: "User", action: "Read Self" },
        },
        {
          AnyOf: [
            {
              ReadAllTwo: { type: "permission", resource: "User", action: "Read All" },
              ReadSelfTwo: { type: "permission", resource: "User", action: "Read Self" },
            },
          ],
        },
      ],
    },

    async (userId, roles, authorization) => {
      const { permissions } = await isGroupRequirementMet(roles, {
        ReadAll: {
          type: "permission",
          resource: "User",
          action: "Read All",
        },
        ReadSelf: {
          type: "permission",
          resource: "User",
          action: "Read Self",
        },
      });

      console.log(authorization.ReadAll);

      const users = permissions.ReadAll
        ? await findManyUsers({ employeeActive: true })
        : permissions.ReadSelf
          ? await findManyUsers({ id: userId, employeeActive: true })
          : null;

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
    },
  );
}
