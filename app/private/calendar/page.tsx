import { Skeleton } from "@/components/ui/skeleton";
import { LoaderCircle, LoaderPinwheel } from "lucide-react";

export default async function Home() {
  return (
    <>
      <div className="gap-4 border-b p-4 h-22">
        <Skeleton className="p-4 h-full flex justify-center  items-center">
          <LoaderCircle className="animate-spin" />
        </Skeleton>
      </div>
      <div className="p-4 h-[80vh]">
        <Skeleton className="p-4 h-full  flex justify-center  items-center">
          <LoaderCircle className="animate-spin" />
        </Skeleton>
      </div>
    </>
  );
}
