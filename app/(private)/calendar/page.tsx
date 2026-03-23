import { ServerNavigationPermissions } from "@/lib/permissions/navigation-permissions";
import PrivateCalendar from "./private-calendar";

export default function Calendar() {
  return (
    <ServerNavigationPermissions.Can permissionKey="ViewCalendar">
      <PrivateCalendar></PrivateCalendar>
    </ServerNavigationPermissions.Can>
  );
}
