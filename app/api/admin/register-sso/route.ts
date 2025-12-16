// app/api/internal/sso/register-microsoft/route.ts
import { NextRequest, NextResponse } from "next/server";

import { guardRoute } from "@/lib/api-guard";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { NoContentMessage, SuccessMessage } from "@/lib/api-helpers";

export async function POST(req: NextRequest) {
  return guardRoute(req, { type: "function", check: () => process.env.NODE_ENV === "development" }, async () => {
    try {
      const session_headers = await headers();

      const result = await auth.api.registerSSOProvider({
        body: {
          providerId: "microsoft-entra",
          domain: process.env.NEXT_PUBLIC_BASE_URL?.replace(/^https?:\/\//, "") ?? "localhost:3000",
          issuer: `https://login.microsoftonline.com/${process.env.AZURE_AD_TENANT_ID}/v2.0`,
          oidcConfig: {
            clientId: process.env.AZURE_AD_CLIENT_ID!,
            clientSecret: process.env.AZURE_AD_CLIENT_SECRET!,
            discoveryEndpoint: `https://login.microsoftonline.com/${process.env.AZURE_AD_TENANT_ID}/v2.0/.well-known/openid-configuration`,
            scopes: ["openid", "profile", "email", "offline_access"], // minimal identity scopes
            pkce: true,
            mapping: {
              id: "sub",
              email: "email",
              emailVerified: "email_verified",
              name: "name",
              image: "picture",
              extraFields: {
                preferred_username: "preferred_username",
                tid: "tid",
                oid: "oid",
              },
            },
          },
        },
        headers: session_headers,
      });

      return NoContentMessage();
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Registration failed";
      return NextResponse.json({ ok: false, error: errorMessage }, { status: 400 });
    }
  });

  // 2) Perform the registration (server-side: secrets stay safe)
}
