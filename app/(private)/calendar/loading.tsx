import { Skeleton } from "@/components/ui/skeleton";
import { LoaderCircle } from "lucide-react";

export default function Loading() {
  // You can add any UI inside Loading, including a Skeleton.
  return <CalendarLoadingPage />;
}

export function CalendarLoadingPage() {
  return (
    <>
      <div className="gap-4 border-b p-4 h-22">
        <Skeleton className="p-4 h-full flex justify-center  items-center"></Skeleton>
      </div>
      <div className="p-4 h-[80vh]">
        <Skeleton className="p-4 h-full  flex justify-center  items-center"></Skeleton>
      </div>
    </>
  );
}
