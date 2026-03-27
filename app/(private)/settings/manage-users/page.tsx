import { SharedUserDrawerProvider } from "@/app/features/user-drawer/drawer-context";
import { UserLayout } from "@/app/features/users/user-layout";
import { ServerNavigationPermissions } from "@/lib/permissions/navigation-permissions";

export default function Home() {
  return (
    <ServerNavigationPermissions.Can permissionKey="EditUsers">
      <SharedUserDrawerProvider>
        <UserLayout />
      </SharedUserDrawerProvider>
    </ServerNavigationPermissions.Can>
  );
}
