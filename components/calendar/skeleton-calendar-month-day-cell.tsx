import { ICalendarCell } from "@/lib/interfaces";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { endOfMonth, getDaysInMonth, isToday, startOfMonth, subMonths } from "date-fns";

function getDays(selectedDate: Date) {
  const daysInMonth = getDaysInMonth(selectedDate);
  const beforeDays = startOfMonth(selectedDate).getDay();
  const daysInLastMonth = getDaysInMonth(subMonths(selectedDate, 1));

  const daysInLastRow = (daysInMonth + beforeDays) % 7;
  const afterDays = daysInLastRow > 0 ? 7 - daysInLastRow : 0;

  const dayList = [];

  for (let index = daysInLastMonth - beforeDays; index < daysInLastMonth; index++) {
    dayList.push({ day: index + 1, type: "before" });
  }

  for (let index = 0; index < daysInMonth; index++) {
    dayList.push({ day: index + 1, type: "current" });
  }

  for (let index = 0; index < afterDays; index++) {
    dayList.push({ day: index + 1, type: "after" });
  }

  return dayList;
}
const WEEK_DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function MonthViewDayCellSkeleton({ date }: { date: Date }) {
  const dayList = getDays(date);

  return (
    <>
      <div className="grid grid-cols-7 overflow-hidden">
        {WEEK_DAYS.map((day) => (
          <div
            key={day}
            className={cn("flex items-center justify-center py-2 border-l", day === "Sun" && "border-l-0")}
          >
            <span className="text-xs font-medium text-muted-foreground">{day}</span>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 overflow-hidden">
        {dayList.map((dayRecord, index) => {
          const isSunday = index % 7 === 0;

          return (
            <div
              key={`${dayRecord.type}-${dayRecord.day}`}
              className={cn(
                "flex h-full flex-col gap-1 border-l border-t py-1 overflow-hidden",
                isSunday && "border-l-0"
              )}
            >
              <span
                className={cn("h-4 px-1 text-xs font-semibold lg:px-2", dayRecord.type !== "current" && "opacity-20")}
              >
                {dayRecord.day}
              </span>
              <Skeleton
                className={cn(
                  "flex h-6 gap-1 px-2 sm:h-18 lg:h-23 sm:flex-col sm:px-0",
                  dayRecord.type !== "current" && "opacity-50"
                )}
              ></Skeleton>
              <Skeleton
                className={cn(
                  "h-4.5 px-3.5 text-xs font-semibold text-muted-foreground",
                  dayRecord.type !== "current" && "opacity-50"
                )}
              >
                <Skeleton className="sm:hidden h-4"></Skeleton>
                <Skeleton className="hidden sm:block h-4"></Skeleton>
              </Skeleton>
            </div>
          );
        })}
      </div>
    </>
  );
}
