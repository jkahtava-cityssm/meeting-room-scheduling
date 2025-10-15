import { NextRequest } from "next/server";
import { getServerSession, Role } from "./auth";
import { SessionAction, SessionResource, SessionRole } from "./types";
import { prisma } from "@/prisma";
import { BadRequestMessage, hasPermission, hasRole, InternalServerErrorMessage, VerifyToken } from "./api-helpers";

type PermissionRequirement =
  | { type: "permission"; resource: SessionResource; action: SessionAction }
  | { type: "role"; role: SessionRole }
  | { type: "function"; check: (roles: Role[] | undefined) => boolean | Promise<boolean> };

export async function guardRoute(
  req: NextRequest,
  permissions: PermissionRequirement[],
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

  const results = await Promise.all(permissions.map((permission) => isRequirementMet(roles, permission)));
  const anyPermissionGranted = results.some(Boolean);

  if (!anyPermissionGranted) {
    return BadRequestMessage("Not Authorized");
  }

  return handler(userId);
}

async function isRequirementMet(roles: Role[] | undefined, requirement: PermissionRequirement): Promise<boolean> {
  if (!roles) return false;

  switch (requirement.type) {
    case "permission":
      return hasPermission(roles, requirement.resource, requirement.action);
    case "role":
      return hasRole(roles, requirement.role);
    case "function":
      return await Promise.resolve(requirement.check(roles));
    default:
      return false;
  }
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
