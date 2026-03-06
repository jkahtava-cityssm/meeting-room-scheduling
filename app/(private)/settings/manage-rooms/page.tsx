"use client";

import { SharedRoomDrawerProvider } from "@/app/features/room-drawer/shared-room-drawer-context";
import RoomLayout from "@/app/features/rooms/room-layout";

export default function Home() {
  return (
    <SharedRoomDrawerProvider>
      <RoomLayout />
    </SharedRoomDrawerProvider>
  );
}
