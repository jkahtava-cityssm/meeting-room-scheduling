import { guardRoute } from "@/lib/api-guard";
import { InternalServerErrorMessage, SuccessMessage } from "@/lib/api-helpers";

import { findManyRooms } from "@/lib/data/rooms";
import { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  return guardRoute(
    req,
    {
      AllOf: [{ ReadRoom: { type: "permission", resource: "Room", action: "Read" } }],
      Passthrough: [
        {
          ViewPrivate: {
            type: "permission",
            resource: "Room",
            action: "View Hidden",
          },
        },
      ],
    },

    async (sessionUserId, permissionCache, permissions, sessionId) => {
      const roleIds = permissionCache.roleIdSet ? Array.from(permissionCache.roleIdSet) : [];

      const rooms = await findManyRooms({
        OR: [{ roomRoles: { some: { roleId: { in: roleIds } } } }, { roomRoles: { none: {} } }],
      });

      if (!rooms) {
        return InternalServerErrorMessage();
      }

      return SuccessMessage("Collected Rooms", rooms);
    },
  );
}
