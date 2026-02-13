import { NextRequest } from "next/server";
import { getServerSession, Role } from "./auth";
import { SessionAction, SessionResource, SessionRole } from "./types";
import { prisma } from "@/prisma";
import {
  BadRequestMessage,
  ForbiddenMessage,
  InternalServerErrorMessage,
  UnauthorizedMessage,
  VerifyToken,
} from "./api-helpers";

import {
  buildPermissionCache,
  GroupedPermissionRequirement,
  GuardRequirement,
  isGroupRequirementMet,
  PermissionCache,
  PermissionResult,
} from "./auth-permission-checks";

import { getRolesByUserId } from "./data/permissions";

export async function guardRoute<const T extends GuardRequirement>(
  req: NextRequest,
  groupedRequirements: T,
  handler: (
    userId: number,
    roles: PermissionCache,
    authorization: PermissionResult<T>,
    sessionId: number | null,
  ) => Promise<Response>,
): Promise<Response> {
  if (!process.env.DATABASE_URL) {
    return InternalServerErrorMessage("DATABASE_URL Missing");
  }

  const user = await getUserFromRequest(req);

  if (!user) {
    return UnauthorizedMessage();
  }

  const permissionCache = buildPermissionCache(user.roles);

  const { authorized, permissions, unauthorizedMessages } = await isGroupRequirementMet(
    permissionCache,
    groupedRequirements,
  );

  if (!authorized) {
    return ForbiddenMessage(`Missing permissions: ${unauthorizedMessages.join(", ")}`);
  }

  return handler(user.userId, permissionCache, permissions, user.sessionId);
}

async function getUserFromRequest(
  req: NextRequest,
): Promise<{ userId: number; roles: Role[]; sessionId: number | null } | null> {
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

    if (!account?.userId) return null;

    const roles = await getRolesByUserId(account.userId);

    if (!roles) return null;

    return { userId: account.userId, roles, sessionId: null };
  }

  const session = await getServerSession();
  if (!session) return null;

  return { userId: Number(session.user.id), roles: session.user.roles, sessionId: Number(session.session?.id) };
}
