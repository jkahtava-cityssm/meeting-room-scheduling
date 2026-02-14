import { NextRequest } from "next/server";
import { getServerSession, Role } from "./auth";
import { SessionAction, SessionResource, SessionRole } from "./types";
import { prisma } from "@/prisma";
import { BadRequestMessage, ForbiddenMessage, InternalServerErrorMessage, UnauthorizedMessage, VerifyToken } from "./api-helpers";

import { buildPermissionCache, isGroupRequirementMet, PermissionCache, PermissionRequirement } from "./auth-permission-checks";

import { getRolesByUserId } from "./data/permissions";

export type LabeledRequirements = {
	[label: string]: PermissionRequirement | PermissionRequirement[];
};

export type GuardRequirement =
	| {
			AllOf?: LabeledRequirements[];
			AnyOf?: LabeledRequirements[];
			Passthrough?: LabeledRequirements[];
	  }
	| LabeledRequirements;

type UnionToIntersection<U> = (U extends unknown ? (k: U) => void : never) extends (k: infer I) => void ? I : never;

export type PermissionResult<T> = {
	[K in keyof UnionToIntersection<ExtractLabels<T>>]: boolean;
};

// A helper to flatten the labels from a nested GuardRequirement
export type ExtractLabels<T> = T extends { AllOf?: unknown } | { AnyOf?: unknown } | { Passthrough?: unknown }
	?
			| (T extends { AllOf: Array<infer U> } ? U : never)
			| (T extends { AnyOf: Array<infer U> } ? U : never)
			| (T extends { Passthrough: Array<infer U> } ? U : never)
	: T;

export async function guardRoute<const T extends GuardRequirement>(
	req: NextRequest,
	groupedRequirements: T,
	handler: (userId: number, roles: PermissionCache, authorization: PermissionResult<T>, sessionId: number | null) => Promise<Response>,
): Promise<Response> {
	if (!process.env.DATABASE_URL) {
		return InternalServerErrorMessage("DATABASE_URL Missing");
	}

	const user = await getUserFromRequest(req);

	if (!user) {
		return UnauthorizedMessage();
	}

	const permissionCache = buildPermissionCache(user.roles);

	const { authorized, permissions, unauthorizedMessages } = await evaluateGuard(permissionCache, groupedRequirements);

	if (!authorized) {
		return ForbiddenMessage(`Missing permissions: ${unauthorizedMessages.join(", ")}`);
	}

	return handler(user.userId, permissionCache, permissions, user.sessionId);
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

export async function evaluateGuard<T extends GuardRequirement>(
	cache: PermissionCache,
	req: T,
): Promise<{ authorized: boolean; permissions: PermissionResult<T>; unauthorizedMessages: string[] }> {
	const results: Record<string, boolean> = {};
	const allMessages: string[] = [];

	const isGateStructure = "AllOf" in req || "AnyOf" in req || "Passthrough" in req;
	const normalizedReq = isGateStructure
		? (req as { AllOf?: LabeledRequirements[]; AnyOf?: LabeledRequirements[]; Passthrough?: LabeledRequirements[] })
		: { AllOf: [req as LabeledRequirements] };

	const evaluateGroups = async (groups: LabeledRequirements[]) => {
		const outcomes: { passed: boolean; messages: string[] }[] = [];

		for (const group of groups) {
			const { byGroup, unauthorizedMessages } = await isGroupRequirementMet(cache, group);
			Object.assign(results, byGroup);

			const groupPassed = Object.values(byGroup).every(v => v);
			outcomes.push({ passed: groupPassed, messages: unauthorizedMessages });
		}
		return outcomes;
	};

	let allOfPassed = true;
	if (normalizedReq.AllOf) {
		const outcomes = await evaluateGroups(normalizedReq.AllOf);
		for (const o of outcomes) {
			if (!o.passed) {
				allOfPassed = false;
				allMessages.push(...o.messages);
			}
		}
	}
	let anyOfPassed = true;
	if (normalizedReq.AnyOf) {
		const outcomes = await evaluateGroups(normalizedReq.AnyOf);
		anyOfPassed = outcomes.some(o => o.passed);

		if (!anyOfPassed) {
			// If the whole AnyOf block failed, collect all failure reasons
			outcomes.forEach(o => allMessages.push(...o.messages));
		}
	}

	if (normalizedReq.Passthrough) {
		await evaluateGroups(normalizedReq.Passthrough);
	}

	return {
		authorized: allOfPassed && anyOfPassed,
		permissions: results as PermissionResult<T>,
		unauthorizedMessages: [...new Set(allMessages)],
	};
}