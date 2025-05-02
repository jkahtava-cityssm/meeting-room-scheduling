import { ICalendarCell } from "@/calendar/interfaces";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { isToday } from "date-fns";

export function MonthViewDayCellSkeleton({ cell }: { cell: ICalendarCell }) {
  const { day, currentMonth, date } = cell;
  const isSunday = date.getDay() === 0;
  const currentDate = new Date();
  const isTodays = isToday(date);

  return (
    <div className={cn("flex h-full flex-col gap-1 border-l border-t py-1 overflow-hidden", isSunday && "border-l-0")}>
      <span
        className={cn(
          "h-4 px-1 text-xs font-semibold lg:px-2",
          !currentMonth && "opacity-20",
          isToday(date) &&
            "flex w-6 translate-x-1 items-center justify-center rounded-full bg-primary px-0 font-bold text-primary-foreground"
        )}
      >
        {day}
      </span>
      <Skeleton
        className={cn("flex h-6 gap-1 px-2 sm:h-18 lg:h-23 sm:flex-col sm:px-0", !currentMonth && "opacity-50")}
      ></Skeleton>
      <Skeleton
        className={cn("h-4.5 px-1.5 text-xs font-semibold text-muted-foreground", !currentMonth && "opacity-50")}
      >
        <Skeleton className="sm:hidden h-4"></Skeleton>
        <Skeleton className="hidden sm:block h-4"></Skeleton>
      </Skeleton>
    </div>
  );
}
