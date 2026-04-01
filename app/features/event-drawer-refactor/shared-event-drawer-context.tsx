import { createContext, useContext, useRef, useState, useCallback, useMemo } from "react";

import { IEventSingleRoom } from "@/lib/schemas";
import EventDrawerRefactor from "./event-drawer-root";
import { EventDrawerPermissions } from "./lib/permissions";
import { useSession } from "@/contexts/SessionProvider";
import { CombinedSchema } from "./event-drawer-schema.validator";

export type EventDrawerPayload = {
  creationDate: Date;
  event?: IEventSingleRoom;
  draft?: CombinedSchema;
  userId?: string;
  roomId?: number;
};

// Shared drawer context to avoid mounting many drawers — mount a single EventDrawer
const SharedDrawerContext = createContext<{
  openEventDrawer: (payload: EventDrawerPayload) => void;
} | null>(null);

export function SharedEventDrawerProvider({ children }: { children: React.ReactNode }) {
  const closeTimerRef = useRef<NodeJS.Timeout | null>(null);
  const [payload, setPayload] = useState<EventDrawerPayload | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  const openEventDrawer = useCallback((payload: EventDrawerPayload) => {
    if (closeTimerRef.current) clearTimeout(closeTimerRef.current);

    setPayload(payload);
    setIsOpen(true);
  }, []);

  const closeEventDrawer = useCallback(() => {
    setIsOpen(false);

    closeTimerRef.current = setTimeout(() => {
      setPayload(null);
      closeTimerRef.current = null;
    }, 300);
  }, []);

  const ctxValue = useMemo(() => ({ openEventDrawer }), [openEventDrawer]);

  const fallbackDate = useMemo(() => new Date(), []);

  return (
    <SharedDrawerContext.Provider value={ctxValue}>
      {children}
      {/* Offscreen trigger wrapped by the single EventDrawer instance */}
      <EventDrawerPermissions.Provider>
        <EventDrawerRefactor
          creationDate={payload ? payload.creationDate : fallbackDate}
          event={payload?.event}
          draft={payload?.draft}
          userId={payload?.userId}
          roomId={payload?.roomId}
          isOpen={isOpen}
          onOpen={() => setIsOpen(true)}
          onClose={() => closeEventDrawer()}
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
