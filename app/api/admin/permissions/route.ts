import { NextRequest } from "next/server";

import { InternalServerErrorMessage, SuccessMessage } from "@/lib/api-helpers";
import { findManyExpandedPermissionSets } from "@/lib/data/permissions";
import { guardRoute } from "@/lib/api-guard";

export async function GET(req: NextRequest) {
  return guardRoute(
    req,

    { EditPermission: { type: "permission", resource: "Settings", action: "Edit Permissions" } },
    async () => {
      const permissionSets = await findManyExpandedPermissionSets();

      if (!permissionSets) {
        return InternalServerErrorMessage();
      }

      return SuccessMessage("PermissionSets Found", permissionSets);
    },
  );
}
