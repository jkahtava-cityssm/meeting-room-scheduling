import { PermissionGrid } from '@/app/features/permissions/permission-layout';
import { ServerNavigationPermissions } from '@/lib/permissions/navigation-permissions';

export default async function PermissionsPage() {
  return (
    <ServerNavigationPermissions.Guard permissionKey="EditPermissions">
      <PermissionGrid />
    </ServerNavigationPermissions.Guard>
  );
}
