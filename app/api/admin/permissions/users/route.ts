import { guardRoute } from "@/lib/api-guard";
import {
  BadRequestMessage,
  CreatedMessage,
  DeleteMessage,
  InternalServerErrorMessage,
  NoContentMessage,
  NotFoundMessage,
  SuccessMessage,
} from "@/lib/api-helpers";
import { findManyUsersWithRoles } from "@/lib/data/users";
import { prisma } from "@/prisma";
import { Prisma } from "@prisma/client";
import { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  return guardRoute(
    request,
    { EditPermission: { type: "permission", resource: "Settings", action: "Edit Permissions" } },

    async (userId, roles, permissions) => {
      const searchParams = request.nextUrl.searchParams;

      const roleId = searchParams.get("roleId");

      if (!roleId) {
        return BadRequestMessage();
      }

      const users = await findManyUsersWithRoles(Number(roleId));

      if (!users) {
        return NotFoundMessage();
      }

      return SuccessMessage("Collected Users", users);
    },
  );
}

export async function PUT(request: NextRequest) {
  return guardRoute(
    request,
    {
      EditPermission: { type: "permission", resource: "Settings", action: "Edit Permissions" },
    },
    async () => {
      const { userId, roleId, assignRole } = await request.json();
      //{ data: permissionList }: { data: rolePermissionMutations[] }
      if (!userId || !roleId || assignRole === undefined) {
        return BadRequestMessage();
      }

      if (assignRole) {
        const userRole = await prisma.userRole.upsert({
          where: { userId_roleId: { userId: Number(userId), roleId: Number(roleId) } },
          create: { userId: Number(userId), roleId: Number(roleId) },
          update: {},
        });
        return SuccessMessage("User Role Assigned", userRole);
      }

      try {
        await prisma.userRole.delete({
          where: { userId_roleId: { userId: Number(userId), roleId: Number(roleId) } },
        });
        return DeleteMessage();
      } catch (e: unknown) {
        if (e instanceof Prisma.PrismaClientKnownRequestError) {
          if (e?.code === "P2025") return NoContentMessage();
        }

        return InternalServerErrorMessage("Failed to remove user role.");
      }
    },
  );
}
