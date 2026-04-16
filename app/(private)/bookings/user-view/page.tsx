import { ServerNavigationPermissions } from '@/lib/permissions/navigation-permissions';

import PrivateUserView from './private-user-view';

export default async function UserView() {
  return (
    <ServerNavigationPermissions.Guard permissionKey="ViewMyBooking">
      <PrivateUserView></PrivateUserView>
    </ServerNavigationPermissions.Guard>
  );
}
