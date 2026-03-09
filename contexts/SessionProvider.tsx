"use client";

import React, { createContext, useContext, useEffect, useState, ReactNode, useCallback } from "react";
import { Session, useSession as useBetterAuthSession } from "@/lib/auth-client";
import { redirect } from "next/navigation";

// Context and Provider
const SessionContext = createContext<{ isPending: boolean; session: Session | null } | null>(null);

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [isPending, setIsPending] = useState(true);
  const [session, setSessionData] = useState<Session | null>(null);

  const onUpdate = useCallback((pending: boolean, nextData: Session | null) => {
    setIsPending(pending);
    setSessionData(nextData);

    if (!pending && !nextData) {
      redirect("/");
    }
  }, []);

  return (
    <SessionContext.Provider value={{ isPending, session }}>
      {children}
      <SessionBridge onUpdate={onUpdate} />
    </SessionContext.Provider>
  );
}

// Bridge to sync with better-auth's useSession
function SessionBridge({ onUpdate }: { onUpdate: (pending: boolean, nextData: Session | null) => void }) {
  const { isPending, data } = useBetterAuthSession();
  useEffect(() => {
    onUpdate(isPending, data ?? null);
  }, [isPending, data, onUpdate]);
  return null;
}

// Custom hook
export function useSession() {
  const context = useContext(SessionContext);
  if (!context) throw new Error("useSession must be used within a SessionProvider");
  return context;
}
