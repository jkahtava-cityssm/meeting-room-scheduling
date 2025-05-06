import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import Link from "next/link";

export function ColumnDayHeaderSkeleton({ weekDays }: { weekDays: Date[] }) {
  return (
    <div className="relative z-20 flex border-b">
      <div className="w-18"></div>
      <div className={`grid flex-1  grid-cols-${weekDays.length} divide-x border-l`}>
        {weekDays.map((day, index) => (
          <span key={index} className="py-2 justify-items-center">
            <Skeleton className="w-20 h-4"></Skeleton>
          </span>
        ))}
      </div>
    </div>
  );
}
