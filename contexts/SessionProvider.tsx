'use client';

import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import { Session, useSession as useBetterAuthSession } from '@/lib/auth-client';
import { useRouter } from 'next/navigation';

// Context and Provider
const SessionContext = createContext<{ isPending: boolean; session: Session | null } | null>(null);

type SessionContextValue = {
  isPending: boolean;
  session: Session | null;
};

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [isPending, setIsPending] = useState(true);
  const [session, setSessionData] = useState<Session | null>(null);

  const onUpdate = useCallback((pending: boolean, nextData: Session | null) => {
    setIsPending(pending);
    setSessionData(nextData);
  }, []);

  useEffect(() => {
    if (!isPending && !session) {
      router.push('/');
    }
  }, [isPending, session, router]);

  const value = useMemo<SessionContextValue>(() => {
    return { isPending, session };
  }, [isPending, session]);

  return (
    <SessionContext.Provider value={value}>
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
  if (!context) throw new Error('useSession must be used within a SessionProvider');
  return context;
}

/*
// Might want to add a comparator to keep session stable


// Minimal identity/expiry comparator
function equalSessionShallow(a: Session, b: Session) {
  if (a === b) return true;
  if (!a || !b) return false;
  const au = a.user, as = a.session;
  const bu = b.user, bs = b.session;

  return (
    au?.id === bu?.id &&
    as?.id === bs?.id &&
    as?.userId === bs?.userId &&
    as?.expiresAt === bs?.expiresAt
  );
}

// Optional: stricter comparator if role changes should re-render immediately
function equalSessionWithRoles(a: Session, b: Session) {
  if (equalSessionShallow(a, b) === false) return false;
  if (!a || !b) return true;
  const aRoles = a.user?.roles ?? [];
  const bRoles = b.user?.roles ?? [];
  if (aRoles.length !== bRoles.length) return false;
  for (let i = 0; i < aRoles.length; i++) {
    if (aRoles[i].roleId !== bRoles[i].roleId || aRoles[i].name !== bRoles[i].name) {
      return false;
    }
  }
  return true;
}


const onUpdate = useCallback((pending: boolean, nextData: Session) => {
  setIsPending(prev => (prev !== pending ? pending : prev));
  setSessionData(prev => (equalSessionShallow(prev, nextData) ? prev : nextData));
}, []);
*/
