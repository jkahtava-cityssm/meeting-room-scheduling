import { addMonths, startOfYear } from "date-fns";
import { YearViewMonthSkeleton } from "./skeleton-calendar-year-view-month-cell copy";

function getMonths(selectedDate: Date) {
  const yearStart = startOfYear(selectedDate);
  return Array.from({ length: 12 }, (_, i) => addMonths(yearStart, i));
}

export function YearViewSkeleton({ date }: { date: Date }) {
  //const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  return (
    <div className="p-4">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {getMonths(date).map((month) => {
          return <YearViewMonthSkeleton key={month.toString()} date={month}></YearViewMonthSkeleton>;
        })}
      </div>
    </div>
  );
}
