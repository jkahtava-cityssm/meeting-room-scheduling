'use client';

import { createAuthClient } from 'better-auth/react';
import { customSessionClient } from 'better-auth/client/plugins';
import type { auth } from '@/lib/auth';
import { isEqual } from 'lodash';

import {
  buildPermissionCache,
  GroupedPermissionRequirement,
  isGroupRequirementMet,
  PermissionCache,
  PermissionResult,
} from './auth-permission-checks';
import { useEffect, useMemo, useRef, useState } from 'react';
import { ssoClient } from '@better-auth/sso/client';

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
): { permissions: PermissionResult<T>; cache: PermissionCache | null; isVerifying: boolean } {
  const roles = session?.user?.roles;

  // 1. Maintain a stable reference to roles only if data actually changes
  const [stableRoles, setStableRoles] = useState(roles);
  const lastRolesRef = useRef(roles);

  useEffect(() => {
    if (!isEqual(lastRolesRef.current, roles)) {
      lastRolesRef.current = roles;
      setStableRoles(roles);
    }
  }, [roles]);

  // 2. Initial state setup
  const initialState = useMemo(() => {
    const entries = Object.keys(requirement).map((k) => [k, false] as const);
    return Object.fromEntries(entries) as PermissionResult<T>;
  }, [requirement]);

  const [result, setResult] = useState<PermissionResult<T>>(initialState);
  const [isVerifying, setVerifying] = useState<boolean>(true);

  // 3. Cache built from stableRoles
  const permissionCache = useMemo(() => {
    if (!stableRoles) return null;
    return buildPermissionCache(stableRoles);
  }, [stableRoles]);

  useEffect(() => {
    let active = true;

    if (!permissionCache) {
      setResult(initialState);
      setVerifying(true);
      return;
    }

    // Only trigger the "loading" state if we don't have results
    // or if the cache/requirements have legitimately changed.
    setVerifying(true);

    (async () => {
      const { byGroup: groupedResults } = await isGroupRequirementMet(permissionCache, requirement);

      if (active) {
        setResult(groupedResults as PermissionResult<T>);
        setVerifying(false);
      }
    })();

    return () => {
      active = false;
    };
  }, [requirement, permissionCache, initialState]);

  return { permissions: result, cache: permissionCache, isVerifying };
}

export function getSessionRoles(session: Session | undefined | null) {
  if (!session || !session.user || !session.user.roles) return undefined;

  return session.user.roles.map((role) => role.name);
}
