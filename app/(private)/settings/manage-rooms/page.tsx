import { SharedRoomDrawerProvider } from "@/app/features/room-drawer/drawer-context";
import RoomLayout from "@/app/features/rooms/room-layout";
import { ServerNavigationPermissions } from "@/lib/permissions/navigation-permissions";

export default function Home() {
  return (
    <ServerNavigationPermissions.Can permissionKey="EditRooms">
      <SharedRoomDrawerProvider>
        <RoomLayout />
      </SharedRoomDrawerProvider>
    </ServerNavigationPermissions.Can>
  );
}
