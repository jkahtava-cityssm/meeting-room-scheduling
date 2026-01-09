import { guardRoute } from "@/lib/api-guard";
import { InternalServerErrorMessage, SuccessMessage } from "@/lib/api-helpers";
import { prisma } from "@/prisma";
import { findManyRooms } from "@/lib/data/rooms";
import { NextRequest } from "next/server";
import { isGroupRequirementMet } from "@/lib/auth-permission-checks";

export async function GET(req: NextRequest) {
  return guardRoute(
    req,
    { ReadRoom: { type: "permission", resource: "Room", action: "Read" } },

    async (userId, roles) => {
      const permissions = await isGroupRequirementMet(roles, {
        ViewPrivate: {
          type: "permission",
          resource: "Room",
          action: "View Hidden",
        },
      });

      const roomScopeFilter = permissions.ViewPrivate ? { name: { in: ["Public", "Private"] } } : { name: "Public" };

      const rooms = await findManyRooms({ roomScope: roomScopeFilter });

      if (!rooms) {
        return InternalServerErrorMessage();
      }

      return SuccessMessage("Collected Rooms", rooms);
    }
  );
}
