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
  isGroupRequirementMet,
  PermissionCache,
  PermissionRequirement,
} from "./auth-permission-checks";

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

  const { authorized, permissions, unauthorizedMessages } = await evaluateGuard(permissionCache, groupedRequirements);

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

export async function evaluateGuard<T extends GuardRequirement>(
  cache: PermissionCache,
  req: T,
): Promise<{ authorized: boolean; permissions: PermissionResult<T>; unauthorizedMessages: string[] }> {
  const formattedRequirements = formatPermissionStructure(req);

  const permissions: Record<string, boolean> = {};
  const messages: string[] = [];

  let allOfPassed = true;
  if (formattedRequirements.AllOf) {
    const { groupPermissions, outcomes } = await evaluateGroups(cache, formattedRequirements.AllOf, "AND");

    Object.assign(permissions, groupPermissions);

    for (const o of outcomes) {
      if (!o.passed) {
        allOfPassed = false;
        messages.push(...o.messages);
      }
    }
  }

  let anyOfPassed = true;
  if (formattedRequirements.AnyOf) {
    const { groupPermissions, outcomes } = await evaluateGroups(cache, formattedRequirements.AnyOf, "OR");
    Object.assign(permissions, groupPermissions);

    anyOfPassed = outcomes.length !== 0 || outcomes.some((o) => o.passed);

    if (!anyOfPassed) {
      outcomes.forEach((o) => messages.push(...o.messages));
    }
  }

  if (formattedRequirements.Passthrough) {
    const { groupPermissions } = await evaluateGroups(cache, formattedRequirements.Passthrough, "OR");
    Object.assign(permissions, groupPermissions);
  }

  return {
    authorized: allOfPassed && anyOfPassed,
    permissions: permissions as PermissionResult<T>,
    unauthorizedMessages: [...new Set(messages)],
  };
}

type Outcome = { passed: boolean; messages: string[] };

async function evaluateGroups(
  cache: PermissionCache,
  groups: LabeledRequirements[],
  mode: "AND" | "OR",
): Promise<{ groupPermissions: Record<string, boolean>; outcomes: Outcome[] }> {
  if (!groups?.length) return { groupPermissions: {}, outcomes: [] };

  const evaluations = await Promise.all(groups.map((g) => isGroupRequirementMet(cache, g)));

  const processedGroups: Record<string, boolean> = {};
  const outcomes: Outcome[] = [];

  for (const { byGroup, unauthorizedMessages } of evaluations) {
    Object.assign(processedGroups, byGroup);

    const values = Object.values(byGroup);
    const passed = mode === "AND" ? values.every(Boolean) : values.some(Boolean);

    outcomes.push({ passed, messages: unauthorizedMessages });
  }

  return { groupPermissions: processedGroups, outcomes };
}

type FormattedRequirement = {
  AllOf?: LabeledRequirements[];
  AnyOf?: LabeledRequirements[];
  Passthrough?: LabeledRequirements[];
};

function formatPermissionStructure<T extends GuardRequirement>(requirements: T): FormattedRequirement {
  const isGroupedRequirement =
    typeof requirements === "object" &&
    requirements !== null &&
    (Object.prototype.hasOwnProperty.call(requirements, "AllOf") ||
      Object.prototype.hasOwnProperty.call(requirements, "AnyOf") ||
      Object.prototype.hasOwnProperty.call(requirements, "Passthrough"));

  if (isGroupedRequirement) {
    return {
      AllOf: requirements.AllOf,
      AnyOf: requirements.AnyOf,
      Passthrough: requirements.Passthrough,
    } as FormattedRequirement;
  }

  return { AllOf: [requirements as LabeledRequirements] };
}
