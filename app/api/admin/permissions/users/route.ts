import { guardRoute } from "@/lib/api-guard";
import { NotFoundMessage, SuccessMessage } from "@/lib/api-helpers";
import { findManyUsersWithRoles } from "@/lib/data/users";
import { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  return guardRoute(
    request,
    { EditPermission: { type: "permission", resource: "Settings", action: "Edit Permissions" } },

    async (userId, roles, permissions) => {
      const users = await findManyUsersWithRoles({ userRole: { every: { roleId } } });

      if (!users) {
        return NotFoundMessage();
      }

      return SuccessMessage("Collected Users", users);
    },
  );
}
