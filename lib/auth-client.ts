import { createAuthClient } from "better-auth/react";
import { customSessionClient } from "better-auth/client/plugins";
import type { auth, User } from "@/lib/auth";

export const authClient = createAuthClient({
  /** The base URL of the server (optional if you're using the same domain) */
  baseURL: process.env.BETTER_AUTH_URL,
  plugins: [customSessionClient<typeof auth>()],
});

export type Session = typeof authClient.$Infer.Session;

export const { signIn, signOut, useSession } = authClient;

export function hasClientPermission(session: Session | undefined | null, resource: string, action: string) {
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
