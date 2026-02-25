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

    async ({ sessionUserId, permissionCache, permissions, sessionId, data }) => {
      const roomFilter = permissionCache.isAdmin
        ? {}
        : {
            OR: [
              { roomRoles: { some: { roleId: { in: Array.from(permissionCache.roleIdSet || []) } } } },
              { roomRoles: { none: {} } },
            ],
          };

      const rooms = await findManyRooms(roomFilter);

      if (!rooms) {
        return InternalServerErrorMessage();
      }

      return SuccessMessage("Collected Rooms", rooms);
    },
  );
}
