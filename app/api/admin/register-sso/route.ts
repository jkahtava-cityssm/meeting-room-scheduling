// app/api/internal/sso/register-microsoft/route.ts
import { NextRequest, NextResponse } from 'next/server';

import { guardRoute } from '@/lib/api-guard';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { NoContentMessage, SuccessMessage } from '@/lib/api-helpers';
import { prisma } from '@/prisma';

export async function POST(req: NextRequest) {
  return guardRoute(
    req,
    { IsDevelopment: { type: 'function', check: () => process.env.NEXT_PUBLIC_ENVIRONMENT === 'development' } },
    async ({ sessionUserId, permissionCache, permissions, sessionId }) => {
      try {
        const session_headers = await headers();
        const domain = process.env.NEXT_PUBLIC_BASE_URL?.replace(/^https?:\/\//, '') ?? 'localhost:3000';

        const result = await auth.api.registerSSOProvider({
          body: {
            providerId: 'microsoft',
            domain: domain,
            issuer: `https://login.microsoftonline.com/${process.env.AZURE_AD_TENANT_ID}/v2.0`,
            oidcConfig: {
              clientId: process.env.AZURE_AD_CLIENT_ID!,
              clientSecret: process.env.AZURE_AD_CLIENT_SECRET!,
              authorizationEndpoint: `https://login.microsoftonline.com/${process.env.AZURE_AD_TENANT_ID}/oauth2/v2.0/authorize`,
              tokenEndpoint: `https://login.microsoftonline.com/${process.env.AZURE_AD_TENANT_ID}/oauth2/v2.0/token`,
              jwksEndpoint: `https://login.microsoftonline.com/${process.env.AZURE_AD_TENANT_ID}/discovery/v2.0/keys`,
              discoveryEndpoint: `https://login.microsoftonline.com/${process.env.AZURE_AD_TENANT_ID}/v2.0/.well-known/openid-configuration`,

              scopes: ['openid', 'profile', 'email'], // minimal identity scopes
              pkce: true,
              mapping: {
                id: 'sub',
                email: 'email',
                emailVerified: 'email_verified',
                name: 'name',
                image: 'picture',
              },
            },
          },

          headers: session_headers,
        });

        if (result) {
          await prisma.configuration.update({
            where: { key: 'singleSignOnEnabled' },
            data: { value: 'true' },
          });
        }

        return NoContentMessage();
      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : 'Registration failed';
        return NextResponse.json({ ok: false, error: errorMessage }, { status: 400 });
      }
    },
  );
}
