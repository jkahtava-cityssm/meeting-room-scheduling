import { createAuthClient } from "better-auth/react";
import { customSessionClient } from "better-auth/client/plugins";
import type { auth } from "@/lib/auth";
import { SessionAction, SessionResource, SessionRole } from "./types";
import { hasRole, isRequirementMet } from "./api-helpers";

export const authClient = createAuthClient({
  /** The base URL of the server (optional if you're using the same domain) */
  baseURL: process.env.BETTER_AUTH_URL,
  plugins: [customSessionClient<typeof auth>()],
});

export type Session = typeof authClient.$Infer.Session;
//export type User = typeof authClient.$Infer.Session.user;

export const { signIn, signOut, useSession } = authClient;

export function checkSessionPermission(
  session: Session | undefined | null,
  resource: SessionResource,
  action: SessionAction
) {
  if (!session || !session.user || !session.user.roles) return false;

  return isRequirementMet(session.user.roles, { type: "permission", action, resource });
}

export function checkSessionRole(session: Session | undefined | null, role: SessionRole) {
  if (!session || !session.user || !session.user.roles) return false;

  return isRequirementMet(session.user.roles, { type: "role", role });
}
