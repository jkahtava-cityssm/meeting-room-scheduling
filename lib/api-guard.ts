import { NextRequest } from "next/server";
import { getServerSession, Role } from "./auth";
import { SessionAction, SessionResource, SessionRole } from "./types";
import { prisma } from "@/prisma";
import {
  BadRequestMessage,
  hasPermission,
  hasRole,
  InternalServerErrorMessage,
  isRequirementMet,
  PermissionRequirement,
  VerifyToken,
} from "./api-helpers";

export async function guardRoute(
  req: NextRequest,
  requirement: PermissionRequirement,
  handler: (userId: number) => Promise<Response>
): Promise<Response> {
  if (!process.env.DATABASE_URL) {
    return InternalServerErrorMessage("DATABASE_URL Missing");
  }

  const userId = await getUserIdFromRequest(req);

  if (!userId) {
    return BadRequestMessage("Not Authorized");
  }

  const roles = await GetUserPermissions(userId);

  const isAuthorized = await isRequirementMet(roles, requirement);

  if (!isAuthorized) {
    return BadRequestMessage("Not Authorized");
  }

  return handler(userId);
}

async function getUserIdFromRequest(req: NextRequest): Promise<number | null> {
  const authHeader = req.headers.get("authorization");
  const token = (authHeader || "").split("Bearer ").at(1);
  if (token) {
    const tokenResponse = await VerifyToken(token);
    const accountId = tokenResponse.data?.sub;
    if (!accountId) return null;

    const account = await prisma.account.findFirst({
      select: { userId: true },
      where: { accountId },
    });

    return account?.userId ?? null;
  }

  const session = await getServerSession();
  return session ? Number(session.user.id) : null;
}

export async function GetUserPermissions(userId: number): Promise<Role[]> {
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
    where: { id: userId },
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

  return roles;
}
