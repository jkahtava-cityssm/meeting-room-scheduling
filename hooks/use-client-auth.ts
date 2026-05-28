import { useSession } from '@/lib/auth-client';
import { redirect } from 'next/navigation';
import { useEffect } from 'react';

export function useClientSession() {
  const { data: session, isPending } = useSession();

  useEffect(() => {
    if (!isPending && !session) {
      redirect('/login');
    }
  }, [isPending, session]);

  return { session, isPending };
}

/*
export function useClientSession() {
  const { data: session, isPending } = useSession();

  useEffect(() => {
    if (!isPending && !session) {
      redirect("/login");
    }
  }, [isPending, session]);

  const rolesKey = useMemo(() => makeRolesKey(session?.user?.roles), [session?.user?.roles]);

  const userId = session?.user?.id;
  const sessionId = session?.session?.id;

  // Stable session ref updated only when identity primitives change
  const stableSessionRef = useRef<typeof session | null>(null);
  useEffect(() => {
    // Update ref only when session meaningfully changes
    if (!session) {
      stableSessionRef.current = null;
      return;
    }
    const prev = stableSessionRef.current;
    const prevUserId = prev?.user?.id;
    const prevSessionId = prev?.session?.id;

    if (prevUserId !== userId || prevSessionId !== sessionId) {
      stableSessionRef.current = session;
    }
    // If only object identity churned (same userId/sessionId), keep the previous reference
  }, [session, userId, sessionId]);

  // ✅ Memoize without including raw `session` (lint clean)
  const memoized = useMemo(
    () => ({
      session: stableSessionRef.current,
      isPending,
      userId,
      sessionId,
      rolesKey,
    }),
    [isPending, userId, sessionId, rolesKey]
  );

  return memoized;
}

function makeRolesKey(roles: Role[] | undefined): string {
  const normalized = (roles ?? [])
    .map((r) => ({
      roleId: r.roleId,
      name: r.name,
      permissions: (r.permissions ?? [])
        .filter((p) => p.permit) // match your cache logic: only count permitted
        .map((p) => ({
          resource: p.resource,
          action: p.action,
        }))
        .sort((a, b) =>
          a.resource === b.resource
            ? a.action.localeCompare(b.action)
            : (a.resource as string).localeCompare(b.resource as string)
        ),
    }))
    .sort((a, b) => a.roleId - b.roleId);

  return JSON.stringify(normalized);
}


*/
