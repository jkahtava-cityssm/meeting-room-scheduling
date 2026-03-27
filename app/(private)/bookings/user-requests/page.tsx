import { ServerNavigationPermissions } from "@/lib/permissions/navigation-permissions";

import PrivateUserRequests from "./private-user-requests";

export default function Page() {
  return (
    <ServerNavigationPermissions.Guard permissionKey="ViewStaffRequests">
      <PrivateUserRequests></PrivateUserRequests>
    </ServerNavigationPermissions.Guard>
  );
}
