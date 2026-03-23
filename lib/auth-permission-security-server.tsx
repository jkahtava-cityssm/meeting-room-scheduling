import { cache } from "react";
import { getServerSession } from "./auth"; // Your existing session getter
import { getRolesByUserId } from "./data/permissions";
import { evaluateGuard, GuardRequirement } from "./api-guard";
import { buildPermissionCache, PermissionResult } from "./auth-permission-checks";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Terminal } from "lucide-react";

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
    console.log("SERVER CHECK");
    // Reuse your existing logic

    const permissionCache = buildPermissionCache(session.user.roles || []);
    const { authorized, permissions } = await evaluateGuard(permissionCache, REQUIREMENTS);

    return {
      user: session.user,
      authorized,
      permissions,
      // Helper method for clean boolean checks
      can: (key: keyof PermissionResult<T>) => !!permissions[key as keyof typeof permissions],
    };
  });

  // Async Server Component helper
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

  return { getSecurity, Can, AccessDenied: DefaultAccessDenied };
}

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
