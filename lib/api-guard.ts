import { NextRequest } from "next/server";
import { getServerSession, Role } from "./auth";
import { SessionAction, SessionResource, SessionRole } from "./types";
import { prisma } from "@/prisma";
import { BadRequestMessage, InternalServerErrorMessage, VerifyToken } from "./api-helpers";

import {
  buildPermissionCache,
  GroupedPermissionRequirement,
  isGroupRequirementMet,
  PermissionCache,
  RequirementResult,
} from "./auth-permission-checks";

export async function guardRoute(
  req: NextRequest,
  groupedRequirements: GroupedPermissionRequirement,
  handler: (
    userId: number,
    roles: PermissionCache,
    authorization: RequirementResult<GroupedPermissionRequirement>
  ) => Promise<Response>
): Promise<Response> {
  if (!process.env.DATABASE_URL) {
    return InternalServerErrorMessage("DATABASE_URL Missing");
  }

  const userId = await getUserIdFromRequest(req);

  if (!userId) {
    return BadRequestMessage("Not Authorized");
  }

  const roles = await GetUserRolePermissions(userId);
  const permissionCache = buildPermissionCache(roles);

  const groupedAuthorization = await isGroupRequirementMet(permissionCache, groupedRequirements);
  const groupsAuthorized = Object.values(groupedAuthorization).every(Boolean);

  if (!groupsAuthorized) {
    return BadRequestMessage("Not Authorized");
  }

  return handler(userId, permissionCache, groupedAuthorization);
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

export async function GetUserRolePermissions(userId: number): Promise<Role[]> {
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

  if (!user?.userRole || user.userRole.length === 0) {
    return [];
  }

  const roles = user.userRole
    .map((userRole) => {
      return {
        roleId: userRole.role.roleId,
        name: userRole.role.name as SessionRole,
        permissions: userRole.role.roleResourceAction
          .map((permission) => {
            return {
              permit: permission.permit,
              action: permission.action.name as SessionAction,
              resource: permission.resource.name as SessionResource,
            };
          })
          .sort((a, b) =>
            a.resource === b.resource ? a.action.localeCompare(b.action) : a.resource.localeCompare(b.resource)
          ),
      };
    })
    .sort((a, b) => a.roleId - b.roleId);

  return roles;
}
