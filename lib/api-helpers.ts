import { NextRequest, NextResponse } from "next/server";
import { jwtVerify, importJWK, JWTPayload, errors } from "jose";
import { getServerSession, hasServerPermission, Role } from "./auth";
import { SessionAction, SessionResource, SessionRole } from "./types";
import { prisma } from "@/prisma";

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

type PermissionRequirement = {
  resource: SessionResource;
  action: SessionAction;
};

export async function withChecks(
  req: NextRequest,
  permissions: PermissionRequirement[],
  handler: (session: any) => Promise<Response>
): Promise<Response> {
  if (!process.env.DATABASE_URL) {
    return InternalServerErrorMessage("DATABASE_URL Missing");
  }

  const authHeader = req.headers.get("authorization");
  const token = (authHeader || "").split("Bearer ").at(1);
  let roles: Role[] | undefined = undefined;

  if (token) {
    const tokenResponse = await VerifyToken(token);

    if (!tokenResponse.data) {
      return BadRequestMessage("Not Authorized");
    } else {
      const userId = await prisma.account.findFirst({
        select: { userId: true },
        where: { accountId: tokenResponse.data.sub },
      });
      if (!userId) {
        return BadRequestMessage("Not Authorized");
      }

      roles = await GetUserPermissions(Number(userId));
    }
  } else {
    const session = await getServerSession();

    if (!session) {
      return BadRequestMessage("Not Authorized");
    }

    roles = session.user.roles;
  }

  const allPermissionsGranted = permissions.every(({ resource, action }) => hasPermission(roles, resource, action));

  if (!allPermissionsGranted) {
    return BadRequestMessage("Not Authorized");
  }

  return handler(undefined);
  return handler(session);
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
  if (!roles) return false;

  return roles.some((item) => {
    return item.name.toLowerCase() === role.toLowerCase();
  });
}
