import { Skeleton } from "@/components/ui/skeleton";
import { format, getDaysInMonth, startOfMonth } from "date-fns";

function getDays(selectedDate: Date) {
  const totalDays = getDaysInMonth(selectedDate);
  const firstDay = startOfMonth(selectedDate).getDay();

  const days: number[] = Array.from({ length: totalDays }, (_, i) => i + 1);

  const blanks: number[] = Array.from({ length: firstDay }, (_, i) => i * -1).reverse();
  return [...blanks, ...days];
}

export function YearViewMonthSkeleton({ date }: { date: Date }) {
  const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  return (
    <div className="flex flex-col">
      <Skeleton className="w-full h-10 rounded-t-lg rounded-b-none border px-3 py-2 text-sm font-semibold text-center">
        {format(date, "MMMM")}
      </Skeleton>
      <div className="flex-1 space-y-2 rounded-b-lg border border-t-0 p-3">
        <div className="grid grid-cols-7 gap-x-0.5 text-center">
          {weekDays.map((day, index) => (
            <div key={index} className="text-xs font-medium text-muted-foreground">
              {day}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-x-0.5 gap-y-2">
          {getDays(date).map((day, index) => {
            if (day <= 0) return <div key={index} className="h-10" />;
            return (
              <Skeleton
                key={index}
                className="flex h-11 flex-1 flex-col items-center justify-start gap-0.5 rounded-md pt-1 hover:bg-accent focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}
