import { prisma } from "@/prisma";
import { findSession } from "@/lib/data/users";

import { NextRequest } from "next/server";

import { BadRequestMessage, InternalServerErrorMessage, SuccessMessage } from "@/lib/api-helpers";

import { auth, Role } from "@/lib/auth";
import { getRolesByUserId } from "@/lib/data/permissions";

const roleCache = new Map<string, { roles: Role[]; expiresAt: number }>();

export async function GET(req: NextRequest, { params }: { params: Promise<{ userId: string }> }) {
	if (!process.env.DATABASE_URL) {
		return InternalServerErrorMessage("DATABASE_URL Missing");
	}

	const { userId } = await params;

	if (!userId) {
		return BadRequestMessage();
	}

	const sessionResponse = await auth.api.getSession({ headers: req.headers });

	if (!sessionResponse || sessionResponse.user.id !== userId) {
		if (sessionResponse?.session?.token) {
			roleCache.delete(sessionResponse.session.token);
		}
		return BadRequestMessage("Not Authorized");
	}

	const token = sessionResponse.session?.token;
	const now = Date.now();

	const cached = roleCache.get(token);
	if (cached) {
		if (cached.expiresAt < now) {
			roleCache.delete(token);
		} else {
			return SuccessMessage("User Found", { userId: userId, roles: cached.roles });
		}
	}

	const roles = await getRolesByUserId(Number(userId));

	if (!roles) {
		return InternalServerErrorMessage();
	}

	roleCache.set(token, {
		roles,
		expiresAt: now + 60 * 1000, // 1 minute TTL
	});

	return SuccessMessage("User Found", { userId: Number(userId), roles: roles });
}
