import { cn } from "@/lib/utils";

import { DayView } from "./calendar-month-view";

export function MonthViewDayFooter({ dayRecord }: { dayRecord: DayView }) {
  return (
    <div className={cn("flex h-full flex-col gap-1 border-l py-1 overflow-hidden", dayRecord.isSunday && "border-l-0")}>
      <p
        className={cn(
          "h-4.5 px-1.5 text-xs font-semibold text-muted-foreground",
          !dayRecord.isCurrentMonth && "opacity-50"
        )}
      >
        {dayRecord.eventRecords.length > 0 && <span className="sm:hidden">+{dayRecord.eventRecords.length}</span>}
        {dayRecord.eventRecords.length > 3 && (
          <span className="hidden sm:block"> {dayRecord.eventRecords.length} events</span>
        )}
      </p>
    </div>
  );
}
