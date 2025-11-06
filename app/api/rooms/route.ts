import { guardRoute } from "@/lib/api-guard";
import { InternalServerErrorMessage, isRequirementMet, SuccessMessage } from "@/lib/api-helpers";
import { prisma } from "@/prisma";
import { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  return guardRoute(
    req,

    { type: "permission", resource: "Room", action: "Read" },

    async (userId, roles) => {
      const hasPrivateAccess = await isRequirementMet(roles, {
        type: "permission",
        resource: "Room",
        action: "AccessPrivate",
      });

      const roomScopeFilter = hasPrivateAccess ? { name: { in: ["Public", "Private"] } } : { name: "Public" };

      const rooms = await prisma.room.findMany({
        select: {
          roomId: true,
          name: true,
          color: true,
          icon: true,
          roomScopeId: true,
          roomScope: { select: { roomScopeId: true, name: true, createdAt: true, updatedAt: true, accessLevel: true } },
          roomCategoryId: true,
          roomCategory: { select: { roomCategoryId: true, name: true, createdAt: true, updatedAt: true } },

          roomProperty: true,
          createdAt: true,
          updatedAt: true,
        },
        where: { roomScope: roomScopeFilter },
      });

      if (!rooms) {
        return InternalServerErrorMessage();
      }

      return SuccessMessage("Collected Rooms", rooms);
    }
  );
}
