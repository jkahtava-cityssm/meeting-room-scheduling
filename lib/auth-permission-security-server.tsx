import { cache, Suspense } from "react";
import { getServerSession } from "./auth"; // Your existing session getter
import { getRolesByUserId } from "./data/permissions";
import { evaluateGuard, GuardRequirement } from "./api-guard";
import { buildPermissionCache, PermissionResult } from "./auth-permission-checks";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ShieldCheck, Terminal } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export function createServerSecurity<const T extends GuardRequirement>(REQUIREMENTS: T) {
  const getSecurity = cache(async () => {
    const session = await getServerSession();

    if (!session?.user) {
      return {
        authorized: false,
        permissions: {} as PermissionResult<T>,
        user: null,
        can: () => false,
      };
    }

    const permissionCache = buildPermissionCache(session.user.roles || []);
    const { authorized, permissions } = await evaluateGuard(permissionCache, REQUIREMENTS);

    return {
      user: session.user,
      authorized,
      permissions,

      can: (key: keyof PermissionResult<T>) => !!permissions[key as keyof typeof permissions],
    };
  });

  async function Can({
    permissionKey,
    fallback,
    children,
  }: {
    permissionKey: keyof PermissionResult<T>;
    fallback?: React.ReactNode;
    children: React.ReactNode;
  }) {
    const { can } = await getSecurity();
    return can(permissionKey) ? <>{children}</> : <>{fallback ?? <DefaultAccessDenied />}</>;
  }

  function Guard({
    permissionKey,
    fallback,
    loading = <DefaultLoadingSkeleton />,
    children,
  }: {
    permissionKey: keyof PermissionResult<T>;
    fallback?: React.ReactNode;
    loading?: React.ReactNode;
    children: React.ReactNode;
  }) {
    return (
      <Suspense fallback={loading}>
        <Can permissionKey={permissionKey} fallback={fallback}>
          {children}
        </Can>
      </Suspense>
    );
  }

  return { getSecurity, Guard, AccessDenied: DefaultAccessDenied };
}

const DefaultLoadingSkeleton = () => {
  return (
    <div className="relative overflow-hidden rounded-xl border bg-muted/20 min-w-92 h-32 flex flex-col items-center justify-center gap-3 p-6">
      <div className="absolute inset-0 bg-linear-to-b from-transparent via-primary/5 to-transparent animate-scan" />

      <div className="relative flex flex-col items-center gap-2">
        <ShieldCheck className="h-8 w-8 text-muted-foreground/40 animate-pulse" />
        <div className="space-y-2 flex flex-col items-center">
          <Skeleton className="h-4 w-32" /> Verifying Permissions
          <Skeleton className="h-3 w-24 opacity-60" /> Please Wait
        </div>
      </div>
    </div>
  );
};

const DefaultAccessDenied = () => {
  return (
    <div className="flex flex-1 min-h-0">
      <div className={"flex flex-col min-h-0  min-w-0 transition-[width] duration-600 ease-in-out flex-1 p-4"}>
        <Alert variant="destructive" className="mt-4 ">
          <Terminal className="h-4 w-4" />
          <AlertTitle>{"Access Denied"}</AlertTitle>
          <AlertDescription>{"You do not have permission to view this content"}</AlertDescription>
        </Alert>
      </div>
    </div>
  );
};
