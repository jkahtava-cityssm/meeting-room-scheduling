import { cache, Suspense } from "react";
import { getServerSession } from "./auth"; // Your existing session getter
import { getRolesByUserId } from "./data/permissions";
import { evaluateGuard, GuardRequirement } from "./api-guard";
import { buildPermissionCache, PermissionResult } from "./auth-permission-checks";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ShieldCheck, Terminal } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";

export function createServerSecurity<const T extends GuardRequirement>(REQUIREMENTS: T) {
  const getSecurity = cache(async () => {
    const session = await getServerSession();
    console.log("Session in security check:", session);
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
    <div className="h-[calc(100vh-var(--header-height)-1px)] transition-[width] duration-300 min-w-0 flex flex-col overflow-hidden rounded-xl ">
      <Skeleton className="w-full h-full " />
    </div>
  );
  return (
    <div className="flex flex-1 flex-col  p-4">
      <Empty className="border border-dashed flex flex-1 flex-col">
        <EmptyHeader>
          <EmptyMedia>
            <ShieldCheck />
          </EmptyMedia>
          <EmptyTitle>Verifying Access</EmptyTitle>
          <EmptyDescription>Please Wait</EmptyDescription>
        </EmptyHeader>
      </Empty>
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
