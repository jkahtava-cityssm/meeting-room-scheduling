import { SharedUserDrawerProvider } from '@/app/features/user-drawer/drawer-context';
import { UserLayout } from '@/app/features/users/user-layout';
import { ServerNavigationPermissions } from '@/lib/permissions/navigation-permissions';

export default async function Home() {
  return (
    <ServerNavigationPermissions.Guard permissionKey="EditUsers">
      <SharedUserDrawerProvider>
        <UserLayout />
      </SharedUserDrawerProvider>
    </ServerNavigationPermissions.Guard>
  );
}
