"use client";

import { createContext, useContext, useRef, useState, useCallback, useMemo } from "react";

import { IRoom } from "@/lib/schemas";

import RoomDrawer from "./room-drawer-root";

export type RoomDrawerPayload = { room?: IRoom };

const SharedDrawerContext = createContext<{
  openRoomDrawer: (payload: RoomDrawerPayload) => void;
} | null>(null);

export function SharedRoomDrawerProvider({ children }: { children: React.ReactNode }) {
  const triggerRef = useRef<HTMLButtonElement | null>(null);

  const [payload, setPayload] = useState<RoomDrawerPayload | null>(null);

  const openRoomDrawer = useCallback((payload: RoomDrawerPayload) => {
    setPayload(payload || null);

    try {
      triggerRef.current?.click();
    } catch (e) {
      // ignore
    }
  }, []);

  const ctxValue = useMemo(() => ({ openRoomDrawer }), [openRoomDrawer]);

  return (
    <SharedDrawerContext.Provider value={ctxValue}>
      {children}

      <RoomDrawer {...payload}>
        <button ref={triggerRef} aria-hidden tabIndex={-1} onClick={(e) => e.stopPropagation()} />
      </RoomDrawer>
    </SharedDrawerContext.Provider>
  );
}

export function useSharedRoomDrawer() {
  const ctx = useContext(SharedDrawerContext);
  if (!ctx) throw new Error("useSharedDrawer must be used within SharedRoomDrawerProvider");
  return ctx;
}
