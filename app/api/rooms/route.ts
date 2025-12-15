import { guardRoute } from "@/lib/api-guard";
import { InternalServerErrorMessage, isRequirementMet, SuccessMessage } from "@/lib/api-helpers";
import { prisma } from "@/prisma";
import { findManyRooms } from "@/lib/data/rooms";
import { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  return guardRoute(
    req,

    { type: "permission", resource: "Room", action: "Read" },

    async (userId, roles) => {
      const hasPrivateAccess = await isRequirementMet(roles, {
        type: "permission",
        resource: "Room",
        action: "View Hidden",
      });

      const roomScopeFilter = hasPrivateAccess ? { name: { in: ["Public", "Private"] } } : { name: "Public" };

      const rooms = await findManyRooms({ roomScope: roomScopeFilter });

      if (!rooms) {
        return InternalServerErrorMessage();
      }

      return SuccessMessage("Collected Rooms", rooms);
    }
  );
}
