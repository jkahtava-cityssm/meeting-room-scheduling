import AuthProvider from "../component/AuthProvider";
import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export default async function Home() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (session) {
    redirect("/bookings/user-view");
  }
  return (
    <AuthProvider>
      <div>HOME - PRIVATE</div>
    </AuthProvider>
  );
}
