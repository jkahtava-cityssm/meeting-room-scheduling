import { hasClientPermission, hasClientRole, useSession } from "@/lib/auth-client";
import { redirect } from "next/navigation";

export function useClientSession() {
  const { data: session, isPending } = useSession();

  if (!session && !isPending) {
    redirect("/");
  }

  return { session, isPending };
}

export function useClientPermission(resource: string, action: string) {
  const { session } = useClientSession();

  if (session) {
    return hasClientPermission(session, resource, action);
  }

  return false;
}

export function useClientRole(role: string) {
  const { session } = useClientSession();

  if (session) {
    return hasClientRole(session, role);
  }

  return false;
}
