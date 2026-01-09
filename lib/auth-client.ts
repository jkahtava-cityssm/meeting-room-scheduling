import { createAuthClient } from "better-auth/react";
import { customSessionClient } from "better-auth/client/plugins";
import type { auth } from "@/lib/auth";
import { SessionAction, SessionResource, SessionRole } from "./types";
import {
  buildPermissionCache,
  GroupedPermissionRequirement,
  isGroupRequirementMet,
  RequirementResult,
} from "./api-helpers";
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
  requirement: T
): RequirementResult<GroupedPermissionRequirement> {
  const roles = session?.user?.roles;

  const initialState = useMemo(() => {
    const entries = Object.keys(requirement).map((k) => [k, false] as const);
    return Object.fromEntries(entries) as RequirementResult<GroupedPermissionRequirement>;
  }, [requirement]);

  const [result, setResult] = useState<RequirementResult<GroupedPermissionRequirement>>(initialState);

  const permissionCache = useMemo(() => {
    if (!roles) return null;
    return buildPermissionCache(roles);
  }, [roles]);

  useEffect(() => {
    let active = true;

    if (!roles || !permissionCache) {
      setResult(initialState);
      return;
    }

    (async () => {
      const groupedResults = await isGroupRequirementMet(permissionCache, requirement);

      if (active) {
        setResult(groupedResults as RequirementResult<GroupedPermissionRequirement>);
      }
    })();

    return () => {
      active = false;
    };
  }, [requirement, roles, permissionCache, initialState]);

  return result;
}

export function getSessionRoles(session: Session | undefined | null) {
  if (!session || !session.user || !session.user.roles) return undefined;

  return session.user.roles.map((role) => role.name);
}
