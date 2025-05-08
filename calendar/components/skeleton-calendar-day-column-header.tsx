import { Skeleton } from "@/components/ui/skeleton";

export function ColumnDayHeaderSkeleton({ weekDays }: { weekDays: Date[] }) {
  return (
    <div className="relative z-20 flex border-b">
      <div className="w-18"></div>
      <div className={`grid flex-1  grid-cols-${weekDays.length} divide-x border-l`}>
        {weekDays.map((day) => (
          <span key={day.toDateString()} className="py-2 justify-items-center">
            <Skeleton className="w-20 h-4"></Skeleton>
          </span>
        ))}
      </div>
    </div>
  );
}
