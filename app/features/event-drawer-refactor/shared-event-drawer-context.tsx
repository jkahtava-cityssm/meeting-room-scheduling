import { createContext, useContext, useRef, useState, useCallback, useMemo } from "react";

import { IEvent } from "@/lib/schemas/calendar";
import EventDrawerRefactor from "./event-drawer-root";
import { EventDrawerPermissions } from "./lib/permissions";
import { useSession } from "@/contexts/SessionProvider";

export type EventDrawerPayload = { creationDate: Date; event?: IEvent; userId?: string; roomId?: number };

// Shared drawer context to avoid mounting many drawers — mount a single EventDrawer
const SharedDrawerContext = createContext<{
  openEventDrawer: (payload: EventDrawerPayload) => void;
} | null>(null);

export function SharedEventDrawerProvider({ children }: { children: React.ReactNode }) {
  const closeTimerRef = useRef<NodeJS.Timeout | null>(null);
  const [payload, setPayload] = useState<EventDrawerPayload | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  const openEventDrawer = useCallback((payload: EventDrawerPayload) => {
    //Cleanup the timer so we dont accidentally clobber the new data
    if (closeTimerRef.current) clearTimeout(closeTimerRef.current);

    setPayload(payload);
    setIsOpen(true);
  }, []);

  const handleOpenChange = useCallback((open: boolean) => {
    setIsOpen(open);

    if (!open) {
      //call the cleanup after the sheet has closed
      closeTimerRef.current = setTimeout(() => {
        setPayload(null);
        closeTimerRef.current = null;
      }, 300);
    }
  }, []);

  const ctxValue = useMemo(() => ({ openEventDrawer }), [openEventDrawer]);

  const fallbackDate = useMemo(() => new Date(), []);
  const { session } = useSession();

  return (
    <SharedDrawerContext.Provider value={ctxValue}>
      {children}
      {/* Offscreen trigger wrapped by the single EventDrawer instance */}
      <EventDrawerPermissions.Provider session={session}>
        <EventDrawerRefactor
          creationDate={payload ? payload.creationDate : fallbackDate}
          event={payload?.event}
          userId={payload?.userId}
          roomId={payload?.roomId}
          isOpen={isOpen}
          onOpenChange={handleOpenChange}
        />
      </EventDrawerPermissions.Provider>
    </SharedDrawerContext.Provider>
  );
}

export function useSharedEventDrawer() {
  const ctx = useContext(SharedDrawerContext);
  if (!ctx) throw new Error("useSharedDrawer must be used within SharedEventDrawerProvider");
  return ctx;
}
