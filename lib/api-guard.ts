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
	PermissionResult,
} from "./auth-permission-checks";

import { getRolesByUserId } from "./data/permissions";

export async function guardRoute(
	req: NextRequest,
	groupedRequirements: GroupedPermissionRequirement,
	handler: (
		userId: number,
		roles: PermissionCache,
		authorization: PermissionResult<GroupedPermissionRequirement>,
		sessionId: number | null,
	) => Promise<Response>,
): Promise<Response> {
	if (!process.env.DATABASE_URL) {
		return InternalServerErrorMessage("DATABASE_URL Missing");
	}

	const user = await getUserFromRequest(req);

	if (!user) {
		return BadRequestMessage("Not Authorized");
	}

	const permissionCache = buildPermissionCache(user.roles);

	const groupedAuthorization = await isGroupRequirementMet(permissionCache, groupedRequirements);
	const groupsAuthorized = Object.values(groupedAuthorization).every(Boolean);

	if (!groupsAuthorized) {
		return BadRequestMessage("Not Authorized");
	}

	return handler(user.userId, permissionCache, groupedAuthorization, user.sessionId);
}

async function getUserFromRequest(req: NextRequest): Promise<{ userId: number; roles: Role[]; sessionId: number | null } | null> {
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
