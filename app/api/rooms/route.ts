import { guardRoute } from "@/lib/api-guard";
import { InternalServerErrorMessage, SuccessMessage } from "@/lib/api-helpers";
import { prisma } from "@/prisma";
import { findManyRooms } from "@/lib/data/rooms";
import { NextRequest } from "next/server";
import { isGroupRequirementMet } from "@/lib/auth-permission-checks";
import { PassThrough } from "stream";

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

    async (userId, roles, authorization) => {
      const roomScopeFilter = authorization.ViewPrivate ? { name: { in: ["Public", "Private"] } } : { name: "Public" };

      const rooms = await findManyRooms({ roomScope: roomScopeFilter });

      if (!rooms) {
        return InternalServerErrorMessage();
      }

      return SuccessMessage("Collected Rooms", rooms);
    },
  );
}
