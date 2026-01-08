import { NextResponse } from "next/server";
import { jwtVerify, importJWK, JWTPayload, errors } from "jose";
import { Role } from "./auth";
import { SessionAction, SessionResource, SessionRole } from "./types";

export async function CreatedMessage(message: string, data: object) {
  return NextResponse.json({ message: message, data: data }, { status: 201 }); // Created
}

export async function SuccessMessage(message: string, data: object) {
  return NextResponse.json({ message: message, data: data }, { status: 200 }); // OK
}

export async function NoContentMessage() {
  return NextResponse.json({ status: 204 }); // No Content
}

export async function DeleteMessage() {
  return NextResponse.json({ status: 204 }); // No content
}

export async function InternalServerErrorMessage(message: string = "Internal Server Error") {
  return NextResponse.json({ message: message }, { status: 500 }); // Internal Server Error
}

export async function BadRequestMessage(message: string = "Bad Request") {
  return NextResponse.json({ message: message }, { status: 400 }); // Bad Request
}
export async function UnauthorizedMessage() {
  return NextResponse.json({ status: 401 }); // Not Found
}
export async function ForbiddenMessage(message: string = "Requested Resource is Forbidden") {
  return NextResponse.json({ message: message }, { status: 403 }); // Not Found
}
export async function NotFoundMessage(message: string = "Requested Resource was not found") {
  return NextResponse.json({ message: message }, { status: 404 }); // Not Found
}

export async function VerifyToken(token: string): Promise<{ message: string; data: JWTPayload | undefined }> {
  if (!token) {
    return { message: "Missing token", data: undefined };
  }

  try {
    const trustedIssuers = [
      `https://sts.windows.net/${process.env.AZURE_AD_TENANT_ID}/`,
      `https://login.microsoftonline.com/${process.env.AZURE_AD_TENANT_ID}/v2.0`,
    ];
    const trustedAudiences = [
      "00000003-0000-0000-c000-000000000000",
      "00000002-0000-0000-c000-000000000000",
      `${process.env.AZURE_AD_CLIENT_ID}`,
    ];

    // Decode header and payload
    const [headerB64, payloadB64] = token.split(".");
    const tokenHeader = JSON.parse(Buffer.from(headerB64, "base64url").toString());
    const tokenPayload = JSON.parse(Buffer.from(payloadB64, "base64url").toString());

    if (!trustedIssuers.includes(tokenPayload.iss)) {
      throw new Error(`Untrusted issuer: ${tokenPayload.iss}`);
    }

    if (!trustedAudiences.includes(tokenPayload.aud)) {
      throw new Error(`Untrusted audience: ${tokenPayload.aud}`);
    }

    // Determine JWK endpoint based on issuer
    const jwkEndpoint = tokenPayload.iss?.includes("login.microsoftonline.com")
      ? `https://login.microsoftonline.com/${process.env.AZURE_AD_TENANT_ID}/discovery/v2.0/keys`
      : "https://login.microsoftonline.com/common/discovery/keys";

    const response = await fetch(jwkEndpoint);
    const { keys } = await response.json();

    const jwk = keys.find((key: { kid: string }) => key.kid === tokenHeader.kid);
    if (!jwk) throw new Error("Matching JWK not found");

    const publicKey = await importJWK(jwk, "RS256");

    const { payload } = await jwtVerify(token, publicKey, {
      algorithms: ["RS256"],
      issuer: tokenPayload.iss,
      audience: tokenPayload.aud,
      clockTolerance: 10, // seconds
    });

    return { message: "Token is valid", data: payload };
  } catch (err) {
    if (err instanceof errors.JWTExpired) {
      return { message: "Token has expired", data: undefined };
    }
    const errorMessage = err instanceof Error ? err.message : String(err);
    return { message: errorMessage, data: undefined };
  }
}

const keyOf = (resource: SessionResource, action: SessionAction) => `${resource}::${action}`;

export type PermissionCache = {
  isAdmin: boolean;
  roleSet: Set<SessionRole>;
  permitSet: Set<string>;
  resourceSet: Set<SessionResource>;
};

export function buildPermissionCache(roles: Role[] | undefined): PermissionCache {
  const roleSet = new Set<SessionRole>();
  const permitSet = new Set<string>();
  const resourceSet = new Set<SessionResource>();
  let isAdmin = false;

  for (const role of roles ?? []) {
    const roleName = role.name as SessionRole;
    roleSet.add(roleName);
    if (roleName === "Admin") isAdmin = true;

    for (const p of role.permissions ?? []) {
      if (p.permit) {
        const resource = p.resource as SessionResource;
        const action = p.action as SessionAction;
        // Assuming p.resource/action conform to SessionResource/SessionAction

        permitSet.add(keyOf(resource, action));
        resourceSet.add(resource);
      }
    }
  }

  return { isAdmin, roleSet, permitSet, resourceSet };
}

export type PermissionRequirement =
  | { type: "permission"; resource: SessionResource; action: SessionAction }
  | { type: "resource"; resource: SessionResource }
  | { type: "role"; role: SessionRole }
  | { type: "function"; check: (roles: PermissionCache | undefined) => boolean | Promise<boolean> }
  | { type: "and"; requirements: PermissionRequirement[] }
  | { type: "or"; requirements: PermissionRequirement[] };

export type GroupedPermissionRequirement = Record<string, PermissionRequirement | PermissionRequirement[]>;

export type RequirementResult<T extends Record<string, unknown>> = {
  [K in keyof T]: boolean;
};

async function isRequirementMet(permissionCache: PermissionCache, permission: PermissionRequirement): Promise<boolean> {
  switch (permission.type) {
    case "permission":
      return hasPermission(permissionCache, permission.resource, permission.action);

    case "resource":
      return hasResource(permissionCache, permission.resource);

    case "role":
      return hasRole(permissionCache, permission.role);

    case "function":
      try {
        if (typeof permission.check !== "function") return false;
        return await Promise.resolve(permission.check(permissionCache));
      } catch {
        return false;
      }

    case "and":
      for (const requirement of permission.requirements) {
        const result = await isRequirementMet(permissionCache, requirement);
        if (!result) return false; // short-circuit on first failure
      }
      return true;

    case "or":
      for (const requirement of permission.requirements) {
        const result = await isRequirementMet(permissionCache, requirement);
        if (result) return true; // short-circuit on first success
      }
      return false;

    default:
      return false;
  }
}

function formatRequirementType(
  groupedRequirements: GroupedPermissionRequirement | PermissionRequirement
): GroupedPermissionRequirement {
  //Check if we have a single requirement or grouped requirements
  if (typeof groupedRequirements === "object" && "type" in groupedRequirements) {
    return { ["single"]: groupedRequirements } as GroupedPermissionRequirement;
  }

  return groupedRequirements as GroupedPermissionRequirement;
}

export async function isGroupRequirementMet<T extends Readonly<GroupedPermissionRequirement>>(
  permissionCache: PermissionCache,
  groupedRequirements: T
): Promise<RequirementResult<GroupedPermissionRequirement>> {
  const labels = Object.keys(groupedRequirements) as (keyof T)[];

  const byGroup = {} as RequirementResult<T>;

  if (permissionCache.isAdmin) {
    // Admin: all groups pass
    for (const label of labels) byGroup[label] = true;
    return byGroup;
  }

  // Evaluate each group independently (no cross-group short-circuiting)
  for (const label of labels) {
    const value = groupedRequirements[label];
    const items = Array.isArray(value) ? value : [value];

    let groupResult = true;
    for (const item of items) {
      const ok = await isRequirementMet(permissionCache, item);
      if (!ok) {
        groupResult = false; // short-circuit inside the group
        break;
      }
    }

    byGroup[label] = groupResult;
  }

  return byGroup;
}

function hasPermission(permissionCache: PermissionCache, resource: SessionResource, action: SessionAction) {
  return permissionCache.permitSet.has(keyOf(resource, action));
}

function hasRole(permissionCache: PermissionCache, role: SessionRole) {
  //If it is a public requirement just return true we dont need to check anything
  if (role === "Public") return true;

  if (permissionCache.roleSet.size === 0) return false;

  //if it is a Private requirement we can return true if roles has a value since the user has atleast 1 role
  //we dont care which role
  if (role === "Private") return true;

  return permissionCache.roleSet.has(role);
}

function hasResource(permissionCache: PermissionCache, resource: SessionResource): boolean {
  return permissionCache.resourceSet.has(resource);
}

export function validateVisibleHours(visibleHoursStart?: number, visibleHoursEnd?: number) {
  if (
    !visibleHoursStart ||
    !visibleHoursEnd ||
    visibleHoursStart >= visibleHoursEnd ||
    visibleHoursStart <= 0 ||
    visibleHoursEnd > 24
  ) {
    console.log(
      `Invalid visible hour range: start=${visibleHoursStart}, end=${visibleHoursEnd}. ` +
        `Start Hour must be less than End Hour, start > 0, and end < 24. Defaulting to start=1 and end=24.`
    );
    visibleHoursStart = 1;
    visibleHoursEnd = 24;
  }

  return { visibleHoursStart, visibleHoursEnd };
}

export function validateTimeSlotInterval(interval?: number): number {
  if (!interval) {
    return 1;
  }

  const validDivisors = [1, 2, 3, 4, 5, 6, 10, 12, 15, 20, 30, 60];

  if (!validDivisors.includes(interval)) {
    console.log(`Invalid timeSlotIntervalMinutes: ${interval}. Must be a positive divisor of 60. Defaulting to 1.`);
    return 1;
  }

  return interval;
}
