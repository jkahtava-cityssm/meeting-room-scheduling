import { createContext, useContext, useRef, useState, useCallback, useMemo } from "react";
import EventDrawer from "./event-drawer";
import { IEvent } from "@/lib/schemas/calendar";

export type EventDrawerPayload = { creationDate?: Date; event?: IEvent; userId?: string; roomId?: number };

// Shared drawer context to avoid mounting many drawers — mount a single EventDrawer
const SharedDrawerContext = createContext<{
  openEventDrawer: (payload: EventDrawerPayload) => void;
} | null>(null);

export function SharedEventDrawerProvider({ children }: { children: React.ReactNode }) {
  const triggerRef = useRef<HTMLButtonElement | null>(null);

  const [payload, setPayload] = useState<EventDrawerPayload | null>(null);

  const openEventDrawer = useCallback((payload: EventDrawerPayload) => {
    setPayload(payload || null);
    // click the hidden trigger to open the sheet inside EventDrawer
    try {
      triggerRef.current?.click();
    } catch (e) {
      // ignore
    }
  }, []);

  const ctxValue = useMemo(() => ({ openEventDrawer }), [openEventDrawer]);

  return (
    <SharedDrawerContext.Provider value={ctxValue}>
      {children}
      {/* Offscreen trigger wrapped by the single EventDrawer instance */}

      <EventDrawer {...payload}>
        <button ref={triggerRef} aria-hidden tabIndex={-1} onClick={(e) => e.stopPropagation()} />
      </EventDrawer>
    </SharedDrawerContext.Provider>
  );
}

export function useSharedEventDrawer() {
  const ctx = useContext(SharedDrawerContext);
  if (!ctx) throw new Error("useSharedDrawer must be used within SharedEventDrawerProvider");
  return ctx;
}
