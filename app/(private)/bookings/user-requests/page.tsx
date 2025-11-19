import UserRequests from "@/app/features/bookings/components/user-request";
import { Suspense } from "react";

export default function Page() {
  return (
    <div className="overflow-hidden rounded-xl border min-w-92">
      <Suspense fallback={<>...Loading</>}>
        <UserRequests></UserRequests>
      </Suspense>
    </div>
  );
}
