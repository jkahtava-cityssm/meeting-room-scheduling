import { ServerNavigationPermissions } from "@/lib/permissions/navigation-permissions";
import PrivateCalendar from "./private-calendar";

export default function Calendar() {
  return (
    <ServerNavigationPermissions.Guard permissionKey="ViewCalendar">
      <PrivateCalendar></PrivateCalendar>
    </ServerNavigationPermissions.Guard>
  );
}
