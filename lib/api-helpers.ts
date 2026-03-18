import { NextResponse } from "next/server";
import { jwtVerify, importJWK, JWTPayload, errors } from "jose";

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
  return NextResponse.json({ message: "Unauthorized" }, { status: 401 }); // Not Found
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

export function validateVisibleHours(visibleHoursStart?: number, visibleHoursEnd?: number) {
  if (
    !visibleHoursStart ||
    !visibleHoursEnd ||
    visibleHoursStart >= visibleHoursEnd ||
    visibleHoursStart < 0 ||
    visibleHoursEnd > 24
  ) {
    console.log(
      `Invalid visible hour range: start=${visibleHoursStart}, end=${visibleHoursEnd}. ` +
        `Start Hour must be less than End Hour, start >= 0, and end < 24. Defaulting to start=0 and end=24.`,
    );
    visibleHoursStart = 0;
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
    console.log(`Invalid timeSlotInterval: ${interval}. Must be a positive divisor of 60. Defaulting to 1.`);
    return 1;
  }

  return interval;
}
