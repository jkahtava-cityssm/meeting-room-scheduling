// example: register-microsoft-entra.ts (run in server-side route or admin task)
import { authClient } from "@/lib/auth-client";

export const executeRegister = await authClient.sso.register({
  providerId: "microsoft", // choose a stable ID you’ll also use in sign-in
  domain: "localhost:3000", // used by Better Auth to scope provider
  issuer: `https://login.microsoftonline.com/${process.env.AZURE_AD_TENANT_ID}/v2.0`,
  oidcConfig: {
    // Client credentials from the Entra app registration
    clientId: process.env.AZURE_AD_CLIENT_ID!,
    clientSecret: process.env.AZURE_AD_CLIENT_SECRET!,

    // Either provide discoveryEndpoint or explicit endpoints (discovery is easiest)
    discoveryEndpoint: `https://login.microsoftonline.com/${process.env.AZURE_AD_TENANT_ID}/v2.0/.well-known/openid-configuration`,

    // If you don’t use discovery, you must specify these:
    // authorizationEndpoint: `https://login.microsoftonline.com/<TENANT_ID>/oauth2/v2.0/authorize`,
    // tokenEndpoint: `https://login.microsoftonline.com/<TENANT_ID>/oauth2/v2.0/token`,
    // jwksEndpoint: `https://login.microsoftonline.com/<TENANT_ID>/discovery/v2.0/keys`,

    scopes: ["email", "openid", "profile", "offline_access", "User.Read"],
    pkce: true,

    // Map OIDC claims to Better Auth user fields
    mapping: {
      id: "sub",
      email: "email",
      emailVerified: "email_verified",
      name: "name",
      image: "picture",
      // Optional: extra fields you want to persist
      extraFields: {
        preferred_username: "preferred_username",
        tid: "tid", // tenant id claim (if present)
        oid: "oid", // object id claim (if present)
      },
    },
  },
});
