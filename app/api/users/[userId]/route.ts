import { prisma } from "@/prisma";

import { NextRequest } from "next/server";

import { BadRequestMessage, InternalServerErrorMessage, SuccessMessage } from "@/lib/api-helpers";
import { getServerSession, hasServerPermission } from "@/lib/auth";

export async function GET(req: NextRequest, { params }: { params: Promise<{ userId: string }> }) {
  if (!process.env.DATABASE_URL) {
    return InternalServerErrorMessage("DATABASE_URL Missing");
  }

  //const session = await getServerSession();

  /*if (!session) {
    return BadRequestMessage("Not Authorized");
  }*/

  const { userId } = await params;

  if (!userId) {
    return BadRequestMessage();
  }

  const user = await prisma.user.findFirst({
    include: {
      userRole: {
        include: {
          role: {
            include: { roleResourceAction: { include: { resource: true, action: true } } },
          },
        },
      },
    },
    where: { id: Number(userId) },
  });

  if (!user?.userRole) {
  }

  const roles =
    user?.userRole.map((userRole) => {
      return {
        name: userRole.role.name,
        roleId: userRole.role.roleId,
        permissions: userRole.role.roleResourceAction.map((permission) => {
          return { permit: permission.permit, action: permission.action.name, resource: permission.resource.name };
        }),
      };
    }) || [];

  if (!user) {
    return InternalServerErrorMessage();
  }

  return SuccessMessage("User Found", { userId: user.id, roles: roles });
}
