import { guardRoute } from "@/lib/api-guard";
import { NotFoundMessage, SuccessMessage } from "@/lib/api-helpers";
import { findManyUsers } from "@/lib/data/users";
import { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  return guardRoute(
    request,
    {
      AnyOf: [
        {
          ReadAll: { type: "permission", resource: "User", action: "Read All" },
          ReadSelf: { type: "permission", resource: "User", action: "Read Self" },
        },
      ],
    },

    async (userId, roles, permissions) => {
      const users = permissions.ReadAll
        ? await findManyUsers({ employeeActive: true })
        : permissions.ReadSelf
          ? await findManyUsers({ id: userId, employeeActive: true })
          : null;

      if (!users) {
        return NotFoundMessage();
      }

      return SuccessMessage("Collected Users", users);
    },
  );
}
