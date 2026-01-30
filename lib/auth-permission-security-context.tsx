import * as React from "react";
import type { GroupedPermissionRequirement, PermissionResult, PermissionCache } from "@/lib/auth-permission-checks";
import type { Session } from "@/lib/auth-client";
import { useVerifySessionRequirement } from "@/lib/auth-client";

export function createSecurityContext<const T extends Readonly<GroupedPermissionRequirement>>(PERMISSIONS: T) {
  type Result = PermissionResult<T>;
  type Key = keyof Result;

  type CtxValue = {
    cache: PermissionCache | null;
    permissions: Result;
    isVerifying: boolean;
    can: (key: Key) => boolean;
  };

  const Ctx = React.createContext<CtxValue | null>(null);

  function Provider({ session, children }: { session: Session | null | undefined; children: React.ReactNode }) {
    const { permissions, cache, isVerifying } = useVerifySessionRequirement(session, PERMISSIONS);

    const value = React.useMemo<CtxValue>(() => {
      return {
        cache,
        permissions,
        isVerifying,
        can: (key) => Boolean(permissions[key]),
      };
    }, [cache, permissions, isVerifying]);

    return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
  }

  function usePermissions() {
    const ctx = React.useContext(Ctx);
    if (!ctx) throw new Error("usePermissions must be used within Provider");
    return ctx;
  }

  // Declarative hide/show
  function Can({
    permissionKey,
    fallback = null,
    loadingFallback = null,
    children,
  }: {
    permissionKey: Key;
    fallback?: React.ReactNode;
    loadingFallback?: React.ReactNode;
    children: React.ReactNode;
  }) {
    const { can, isVerifying } = usePermissions();
    if (isVerifying) return <>{loadingFallback}</>;
    return can(permissionKey) ? <>{children}</> : <>{fallback}</>;
  }

  function CanRender({
    permissionKey,
    children,
  }: {
    permissionKey: Key;
    children: (allowed: boolean) => React.ReactNode;
  }) {
    const { can, isVerifying } = usePermissions();
    return <>{children(!isVerifying && can(permissionKey))}</>;
  }

  return {
    PERMISSIONS,
    Provider,
    usePermissions,
    Can,
    CanRender,
  } as const;
}
