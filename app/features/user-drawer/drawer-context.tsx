import { createContext, useContext, useRef, useState, useCallback, useMemo } from "react";

import { IUser } from "@/lib/schemas";
import { UserDrawerPermissions } from "./lib/permissions";

import { CombinedSchema } from "./drawer-schema.validator";
import UserDrawer from "./drawer-root";

export type UserDrawerPayload = {
  creationDate: Date;
  user?: IUser;
  draft?: CombinedSchema;
  userId?: string;
  roomId?: number;
};

// Shared drawer context to avoid mounting many drawers — mount a single UserDrawer
const SharedDrawerContext = createContext<{
  openUserDrawer: (payload: UserDrawerPayload) => void;
} | null>(null);

export function SharedUserDrawerProvider({ children }: { children: React.ReactNode }) {
  const closeTimerRef = useRef<NodeJS.Timeout | null>(null);
  const [payload, setPayload] = useState<UserDrawerPayload | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  const openUserDrawer = useCallback((payload: UserDrawerPayload) => {
    if (closeTimerRef.current) clearTimeout(closeTimerRef.current);

    setPayload(payload);
    setIsOpen(true);
  }, []);

  const closeUserDrawer = useCallback(() => {
    setIsOpen(false);

    closeTimerRef.current = setTimeout(() => {
      setPayload(null);
      closeTimerRef.current = null;
    }, 300);
  }, []);

  const ctxValue = useMemo(() => ({ openUserDrawer }), [openUserDrawer]);

  const fallbackDate = useMemo(() => new Date(), []);

  return (
    <SharedDrawerContext.Provider value={ctxValue}>
      {children}
      {/* Offscreen trigger wrapped by the single UserDrawer instance */}
      <UserDrawerPermissions.Provider>
        <UserDrawer
          creationDate={payload ? payload.creationDate : fallbackDate}
          user={payload?.user}
          isOpen={isOpen}
          onOpen={() => setIsOpen(true)}
          onClose={() => closeUserDrawer()}
        />
      </UserDrawerPermissions.Provider>
    </SharedDrawerContext.Provider>
  );
}

export function useSharedUserDrawer() {
  const ctx = useContext(SharedDrawerContext);
  if (!ctx) throw new Error("useSharedDrawer must be used within SharedUserDrawerProvider");
  return ctx;
}
