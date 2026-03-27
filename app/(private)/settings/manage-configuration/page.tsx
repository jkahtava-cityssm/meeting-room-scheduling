import { ConfigurationPage } from "@/app/features/configuration/configuration-table";
import { ServerNavigationPermissions } from "@/lib/permissions/navigation-permissions";

export default async function ManageConfiguration() {
  return (
    <ServerNavigationPermissions.Guard permissionKey="EditConfiguration">
      <ConfigurationPage></ConfigurationPage>
    </ServerNavigationPermissions.Guard>
  );
}
