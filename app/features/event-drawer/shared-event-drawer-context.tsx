import { createContext, useContext, useRef, useState, useCallback, useMemo } from "react";
import EventDrawer from "./event-drawer";
import { IEvent } from "@/lib/schemas/calendar";

// Shared drawer context to avoid mounting many drawers — mount a single EventDrawer
const SharedDrawerContext = createContext<{
  openEventDrawer: (payload: { creationDate?: Date; event?: IEvent; userId?: string; roomId?: number }) => void;
} | null>(null);

export function SharedEventDrawerProvider({ children }: { children: React.ReactNode }) {
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const [payload, setPayload] = useState<{
    creationDate?: Date;
    event?: IEvent;
    userId?: string;
    roomId?: number;
  } | null>(null);

  const openEventDrawer = useCallback(
    (p: { creationDate?: Date; event?: IEvent; userId?: string; roomId?: number }) => {
      setPayload(p || null);
      // click the hidden trigger to open the sheet inside EventDrawer
      try {
        triggerRef.current?.click();
      } catch (e) {
        // ignore
      }
    },
    [],
  );

  const ctxValue = useMemo(() => ({ openEventDrawer }), [openEventDrawer]);

  return (
    <SharedDrawerContext.Provider value={ctxValue}>
      {children}
      {/* Offscreen trigger wrapped by the single EventDrawer instance */}

      <EventDrawer
        creationDate={payload?.creationDate}
        event={payload?.event}
        userId={payload?.userId}
        roomId={payload?.roomId}
      >
        <button ref={triggerRef} aria-hidden tabIndex={-1} />
      </EventDrawer>
    </SharedDrawerContext.Provider>
  );
}

export function useSharedEventDrawer() {
  const ctx = useContext(SharedDrawerContext);
  if (!ctx) throw new Error("useSharedDrawer must be used within SharedEventDrawerProvider");
  return ctx;
}
