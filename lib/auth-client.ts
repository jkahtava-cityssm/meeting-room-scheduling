import { createAuthClient } from "better-auth/react";
import { customSessionClient } from "better-auth/client/plugins";
import type { auth } from "@/lib/auth";
import { SessionAction, SessionResource, SessionRole } from "./types";

export const authClient = createAuthClient({
  /** The base URL of the server (optional if you're using the same domain) */
  baseURL: process.env.BETTER_AUTH_URL,
  plugins: [customSessionClient<typeof auth>()],
});

export type Session = typeof authClient.$Infer.Session;
//export type User = typeof authClient.$Infer.Session.user;

export const { signIn, signOut, useSession } = authClient;

export function hasClientPermission(
  session: Session | undefined | null,
  resource: SessionResource,
  action: SessionAction
) {
  if (!session || !session.user || !session.user.roles) return false;

  const permission = session.user.roles.some((role) => {
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

export function hasClientRole(session: Session | undefined | null, role: SessionRole) {
  if (!session || !session.user || !session.user.roles) return false;
  return session.user.roles.some((item) => {
    return item.name.toLowerCase() === role.toLowerCase();
  });
}
