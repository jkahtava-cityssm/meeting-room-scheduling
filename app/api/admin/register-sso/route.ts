import { NextRequest } from 'next/server';

import { guardRoute } from '@/lib/api-guard';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { InternalServerErrorMessage, NoContentMessage } from '@/lib/api-helpers';

import { deleteSSOProvider, findFirstConfiguration, updateConfiguration } from '@/lib/data/configuration';

export async function POST(req: NextRequest) {
  return guardRoute(req, { IsDevelopment: { type: 'permission', resource: 'Settings', action: 'Edit Configuration' } }, async ({ sessionUserId }) => {
    try {
      const session_headers = await headers();

      const record = await findFirstConfiguration('singleSignOnEnabled');
      if (record.value === 'true') {
        await updateConfiguration({ key: 'singleSignOnEnabled', value: 'false' }, sessionUserId);
        await deleteSSOProvider({ provider: 'microsoft' }, sessionUserId);
      }

      const result = await auth.api.registerSSOProvider({
        body: {
          providerId: 'microsoft',
          domain: `${process.env.NEXT_PUBLIC_BASE_URL}`,
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
        await updateConfiguration({ key: 'singleSignOnEnabled', value: 'true' }, sessionUserId);
      }

      return NoContentMessage();
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Registration failed';
      return InternalServerErrorMessage(errorMessage);
    }
  });
}
