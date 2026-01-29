import { createAuthClient } from "better-auth/react";
import { customSessionClient } from "better-auth/client/plugins";
import type { auth } from "@/lib/auth";

import {
  buildPermissionCache,
  GroupedPermissionRequirement,
  isGroupRequirementMet,
  PermissionCache,
  PermissionResult,
} from "./auth-permission-checks";
import { useEffect, useMemo, useState } from "react";
import { ssoClient } from "@better-auth/sso/client";

export const authClient = createAuthClient({
  /** The base URL of the server (optional if you're using the same domain) */
  baseURL: process.env.BETTER_AUTH_URL,
  plugins: [customSessionClient<typeof auth>(), ssoClient()],
});

export type Session = typeof authClient.$Infer.Session;
//export type User = typeof authClient.$Infer.Session.user;

export const { signIn, signOut, useSession } = authClient;

export function useVerifySessionRequirement<T extends Readonly<GroupedPermissionRequirement>>(
  session: Session | undefined | null,
  requirement: T,
): { permissions: PermissionResult<T>; cache: PermissionCache | null; loading: boolean } {
  const roles = session?.user?.roles;

  const initialState = useMemo(() => {
    const entries = Object.keys(requirement).map((k) => [k, false] as const);
    return Object.fromEntries(entries) as PermissionResult<T>;
  }, [requirement]);

  const [result, setResult] = useState<PermissionResult<T>>(initialState);
  const [loading, setLoading] = useState<boolean>(true);

  const permissionCache = useMemo(() => {
    if (!roles) return null;
    return buildPermissionCache(roles);
  }, [roles]);

  useEffect(() => {
    let active = true;

    if (!roles || !permissionCache) {
      setResult(initialState);
      setLoading(false);
      return;
    }

    setLoading(true);

    (async () => {
      const groupedResults = await isGroupRequirementMet(permissionCache, requirement);

      if (active) {
        setResult(groupedResults as PermissionResult<T>);
        setLoading(false);
      }
    })();

    return () => {
      active = false;
    };
  }, [requirement, roles, permissionCache, initialState]);

  return { permissions: result, cache: permissionCache, loading };
}

export function getSessionRoles(session: Session | undefined | null) {
  if (!session || !session.user || !session.user.roles) return undefined;

  return session.user.roles.map((role) => role.name);
}
