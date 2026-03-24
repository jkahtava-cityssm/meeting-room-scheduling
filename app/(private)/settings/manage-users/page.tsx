import { SharedRoomDrawerProvider } from "@/app/features/room-drawer/shared-room-drawer-context";

import { UserLayout } from "@/app/features/users/user-layout";
import { ServerNavigationPermissions } from "@/lib/permissions/navigation-permissions";

export default function Home() {
  return (
    <ServerNavigationPermissions.Can permissionKey="EditUsers">
      <SharedRoomDrawerProvider>
        <UserLayout />
      </SharedRoomDrawerProvider>
    </ServerNavigationPermissions.Can>
  );
}
