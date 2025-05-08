import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { useCalendar } from "./contexts/calendar-context";
import Link from "next/link";

export function ColumnDayHeader({ weekDays }: { weekDays: Date[] }) {
  const { setSelectedDate } = useCalendar();

  const handleClick = (currentDate: Date) => setSelectedDate(currentDate);

  return (
    <div className="relative z-20 flex border-b">
      <div className="w-18"></div>
      <div className={`grid flex-1 grid-cols-${weekDays.length} divide-x border-l`}>
        {weekDays.map((day, index) =>
          weekDays.length > 1 ? (
            <Button key={index} variant={"link"} size={"sm"} onClick={() => handleClick(day)}>
              <Link href="day-view">
                <span key={index} className="py-2 text-center text-xs font-medium text-muted-foreground">
                  {format(day, "EE")} <span className="ml-1 font-semibold text-foreground">{format(day, "d")}</span>
                </span>
              </Link>
            </Button>
          ) : (
            <span key={index} className="py-2 text-center text-xs font-medium text-muted-foreground">
              {format(day, "EE")} <span className="ml-1 font-semibold text-foreground">{format(day, "d")}</span>
            </span>
          )
        )}
      </div>
    </div>
  );
}
