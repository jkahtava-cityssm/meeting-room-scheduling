import { PermissionGrid } from "@/app/features/permissions/permission-layout";
import { ServerNavigationPermissions } from "@/lib/permissions/navigation-permissions";

export default function PermissionsPage() {
  return (
    <ServerNavigationPermissions.Can permissionKey="EditPermissions">
      <PermissionGrid />
    </ServerNavigationPermissions.Can>
  );
}
