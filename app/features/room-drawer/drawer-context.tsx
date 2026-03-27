"use client";

import { createContext, useContext, useRef, useState, useCallback, useMemo } from "react";

import { IRoom } from "@/lib/schemas";

import RoomDrawer from "./drawer-root";
import { RoomDrawerPermissions } from "./lib/permissions";

export type RoomDrawerPayload = { room?: IRoom };

// Shared drawer context to avoid mounting many drawers — mount a single RoomDrawer
const SharedDrawerContext = createContext<{
  openRoomDrawer: (payload: RoomDrawerPayload) => void;
} | null>(null);

export function SharedRoomDrawerProvider({ children }: { children: React.ReactNode }) {
  const closeTimerRef = useRef<NodeJS.Timeout | null>(null);
  const [payload, setPayload] = useState<RoomDrawerPayload | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  const openRoomDrawer = useCallback((payload: RoomDrawerPayload) => {
    if (closeTimerRef.current) clearTimeout(closeTimerRef.current);

    setPayload(payload);
    setIsOpen(true);
  }, []);

  const closeRoomDrawer = useCallback(() => {
    setIsOpen(false);

    closeTimerRef.current = setTimeout(() => {
      setPayload(null);
      closeTimerRef.current = null;
    }, 300);
  }, []);

  const ctxValue = useMemo(() => ({ openRoomDrawer }), [openRoomDrawer]);

  return (
    <SharedDrawerContext.Provider value={ctxValue}>
      {children}

      <RoomDrawerPermissions.Provider>
        <RoomDrawer
          room={payload?.room}
          isOpen={isOpen}
          onOpen={() => setIsOpen(true)}
          onClose={() => closeRoomDrawer()}
        />
      </RoomDrawerPermissions.Provider>
    </SharedDrawerContext.Provider>
  );
}

export function useSharedRoomDrawer() {
  const ctx = useContext(SharedDrawerContext);
  if (!ctx) throw new Error("useSharedDrawer must be used within SharedRoomDrawerProvider");
  return ctx;
}
