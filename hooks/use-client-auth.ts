import { useSession } from "@/lib/auth-client";
import { redirect } from "next/navigation";

export function useClientSession() {
  const { data: session, isPending } = useSession();

  if (!session && !isPending) {
    redirect("/");
  }

  return { session, isPending };
}
