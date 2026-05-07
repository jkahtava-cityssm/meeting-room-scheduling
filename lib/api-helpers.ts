import { NextResponse } from 'next/server';
import { jwtVerify, importJWK, JWTPayload, errors } from 'jose';
import { Prisma } from '@prisma/client';

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

export async function InternalServerErrorMessage(message: string = 'Internal Server Error') {
  return NextResponse.json({ message: message }, { status: 500 }); // Internal Server Error
}

export async function BadRequestMessage(message: string = 'Bad Request') {
  return NextResponse.json({ message: message }, { status: 400 }); // Bad Request
}
export async function UnauthorizedMessage() {
  return NextResponse.json({ message: 'Unauthorized' }, { status: 401 }); // Not Found
}
export async function ForbiddenMessage(message: string = 'Requested Resource is Forbidden') {
  return NextResponse.json({ message: message }, { status: 403 }); // Not Found
}
export async function NotFoundMessage(message: string = 'Requested Resource was not found') {
  return NextResponse.json({ message: message }, { status: 404 }); // Not Found
}

export async function VerifyToken(token: string): Promise<{ message: string; data: JWTPayload | undefined }> {
  if (!token) {
    return { message: 'Missing token', data: undefined };
  }

  try {
    const trustedIssuers = [
      `https://sts.windows.net/${process.env.AZURE_AD_TENANT_ID}/`,
      `https://login.microsoftonline.com/${process.env.AZURE_AD_TENANT_ID}/v2.0`,
    ];
    const trustedAudiences = ['00000003-0000-0000-c000-000000000000', '00000002-0000-0000-c000-000000000000', `${process.env.AZURE_AD_CLIENT_ID}`];

    // Decode header and payload
    const [headerB64, payloadB64] = token.split('.');
    const tokenHeader = JSON.parse(Buffer.from(headerB64, 'base64url').toString());
    const tokenPayload = JSON.parse(Buffer.from(payloadB64, 'base64url').toString());

    if (!trustedIssuers.includes(tokenPayload.iss)) {
      throw new Error(`Untrusted issuer: ${tokenPayload.iss}`);
    }

    if (!trustedAudiences.includes(tokenPayload.aud)) {
      throw new Error(`Untrusted audience: ${tokenPayload.aud}`);
    }

    // Determine JWK endpoint based on issuer
    const jwkEndpoint = tokenPayload.iss?.includes('login.microsoftonline.com')
      ? `https://login.microsoftonline.com/${process.env.AZURE_AD_TENANT_ID}/discovery/v2.0/keys`
      : 'https://login.microsoftonline.com/common/discovery/keys';

    const response = await fetch(jwkEndpoint);
    const { keys } = await response.json();

    const jwk = keys.find((key: { kid: string }) => key.kid === tokenHeader.kid);
    if (!jwk) throw new Error('Matching JWK not found');

    const publicKey = await importJWK(jwk, 'RS256');

    const { payload } = await jwtVerify(token, publicKey, {
      algorithms: ['RS256'],
      issuer: tokenPayload.iss,
      audience: tokenPayload.aud,
      clockTolerance: 10, // seconds
    });

    return { message: 'Token is valid', data: payload };
  } catch (err) {
    if (err instanceof errors.JWTExpired) {
      return { message: 'Token has expired', data: undefined };
    }
    const errorMessage = err instanceof Error ? err.message : String(err);
    return { message: errorMessage, data: undefined };
  }
}

export function validateVisibleHours(visibleHoursStart?: number, visibleHoursEnd?: number) {
  if (!visibleHoursStart || !visibleHoursEnd || visibleHoursStart >= visibleHoursEnd || visibleHoursStart < 0 || visibleHoursEnd > 24) {
    console.warn(
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
    console.warn(`Invalid timeSlotInterval: ${interval}. Must be a positive divisor of 60. Defaulting to 1.`);
    return 1;
  }

  return interval;
}

interface PrismaModelDelegate<T, CreateInput, A> {
  findMany: (args: { where: Record<string, unknown>; select: Record<string, boolean> }) => Promise<Partial<T>[]>;
  createMany: (args: A) => Promise<Prisma.BatchPayload>;
}

//This is the ugly function that needs to exist so createMany can use
export async function safeCreateMany<
  T extends Record<string, unknown>,
  CreateInput extends Record<string, unknown>,
  K extends keyof CreateInput & keyof T,
  A, // This represents the model's specific 'CreateManyArgs'
>(model: PrismaModelDelegate<T, CreateInput, A>, data: CreateInput[], uniqueKeys: K[], tx: Prisma.TransactionClient): Promise<Prisma.BatchPayload> {
  const isSqlServer = process.env.DATABASE_PROVIDER === 'sqlserver';

  // 1. Native branch (Non-SQL Server)
  if (!isSqlServer) {
    // We construct the object and cast to 'unknown' then 'A'
    // to satisfy the model-specific requirement for skipDuplicates.
    return await model.createMany({
      data,
      skipDuplicates: true,
    } as unknown as A);
  }

  if (data.length === 0) return { count: 0 };

  // 2. Build the WHERE clause
  const whereClause: Record<string, unknown> = {
    OR: data.map((item) => {
      const filter: Record<string, unknown> = {};
      uniqueKeys.forEach((key) => {
        filter[key as string] = item[key];
      });
      return filter;
    }),
  };

  // 3. Build the SELECT clause
  const selectClause: Record<string, boolean> = uniqueKeys.reduce(
    (acc, key) => {
      acc[key as string] = true;
      return acc;
    },
    {} as Record<string, boolean>,
  );

  // 4. Fetch existing records
  const existing = await model.findMany({
    where: whereClause,
    select: selectClause,
  });

  // 5. Filter out existing records
  const filteredData = data.filter((newItem) => {
    return !existing.some((ext) => {
      return uniqueKeys.every((key) => {
        return ext[key as keyof Partial<T>] === newItem[key];
      });
    });
  });

  // 6. Deduplicate the input array itself
  const finalData = filteredData.filter((v, i, a) => {
    return a.findIndex((t) => uniqueKeys.every((k) => t[k] === v[k])) === i;
  });

  if (finalData.length === 0) return { count: 0 };

  // 7. Execute createMany (Passing only data, as SQL Server expects)
  return await model.createMany({
    data: finalData,
  } as unknown as A);
}

export const APP_DOMAIN = process.env.NEXT_PUBLIC_BASE_URL || '';
export const APP_SUBFOLDER = process.env.NEXT_PUBLIC_SUBFOLDER_PATH || '';
export const APP_FULL_URL = `${APP_DOMAIN}${APP_SUBFOLDER}`;
/*
export function formatServerURL(url: string) {
  const serverURL = process.env.NEXT_PUBLIC_BASE_URL;
  const subfolder = process.env.NEXT_PUBLIC_SUBFOLDER_PATH || '';

  if (!serverURL) {
    throw new Error('NEXT_PUBLIC_BASE_URL is not defined.');
  }

  const base = serverURL.replace(/\/+$/, '') + '/';
  const cleanSubfolder = subfolder ? `/${subfolder.replace(/^\/+|\/+$/g, '')}` : '';
  const path = url.replace(/^\/+/, '');
  const finalPath = `${cleanSubfolder}/${path}`.replace(/\/+/g, '/').replace(/^\//, '');

  return new URL(finalPath, base).toString();
}
*/

export function formatServerURL(url: string) {
  const base = `${APP_DOMAIN}${APP_SUBFOLDER}/`;
  const cleanPath = url.replace(/^\/+/, '');

  return new URL(cleanPath, base);
}
