import { NextRequest } from "next/server";

import { InternalServerErrorMessage, SuccessMessage } from "@/lib/api-helpers";
import { findManyRoles } from "@/lib/data/permissions";
import { guardRoute } from "@/lib/api-guard";

export async function GET(req: NextRequest) {
  return guardRoute(
    req,
    { EditPermission: { type: "permission", resource: "Settings", action: "Edit Permissions" } },
    async ({ sessionUserId, permissionCache, permissions, sessionId }) => {
      const roles = await findManyRoles();

      if (!roles) {
        return InternalServerErrorMessage();
      }

      return SuccessMessage("Roles Found", roles);
    },
  );
}
