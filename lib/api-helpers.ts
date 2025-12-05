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

export type PermissionRequirement =
  | { type: "permission"; resource: SessionResource; action: SessionAction }
  | { type: "role"; role: SessionRole }
  | { type: "function"; check: (roles: Role[] | undefined) => boolean | Promise<boolean> }
  | { type: "and"; requirements: PermissionRequirement[] }
  | { type: "or"; requirements: PermissionRequirement[] };

export async function isRequirementMet(
  roles: Role[] | undefined,
  requirement: PermissionRequirement
): Promise<boolean> {
  if (!roles && requirement.type !== "function") return false;

  const isAdmin = roles?.some((role) => role.name.toLowerCase() === "admin");
  if (isAdmin) return true;

  switch (requirement.type) {
    case "permission":
      return hasPermission(roles, requirement.resource, requirement.action);

    case "role":
      return hasRole(roles, requirement.role);

    case "function":
      return await Promise.resolve(requirement.check(roles));

    case "and":
      for (const req of requirement.requirements) {
        const result = await isRequirementMet(roles, req);
        if (!result) return false; // short-circuit on first failure
      }
      return true;

    case "or":
      for (const req of requirement.requirements) {
        const result = await isRequirementMet(roles, req);
        if (result) return true; // short-circuit on first success
      }
      return false;

    default:
      return false;
  }
}

export function hasPermission(roles: Role[] | undefined, resource: SessionResource, action: SessionAction) {
  if (!roles) return false;

  const permission = roles.some((role) => {
    return role.permissions.some((permission) => {
      return (
        permission.permit === true &&
        permission.resource.toLowerCase() === resource.toLowerCase() &&
        permission.action.toLowerCase() === action.toLowerCase()
      );
    });
  });

  return permission;
}

export function hasRole(roles: Role[] | undefined, role: SessionRole) {
  if (role.toLowerCase() === "any") return true;

  if (!roles) return false;

  return roles.some((item) => {
    return item.name.toLowerCase() === role.toLowerCase();
  });
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
