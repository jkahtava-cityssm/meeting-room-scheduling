import { startOfDay } from "date-fns";
import { eventBadgeVariants, MonthEventBadge } from "@/app/features/calendar/view-month/calendar-month-event-badge";
import { cn } from "@/lib/utils";
import { IMonthDayView } from "../webworkers/generic-webworker";

export function MonthViewDayEvents({ dayRecord, userId }: { dayRecord: IMonthDayView; userId?: string }) {
  return (
    <div
      className={cn(
        "flex h-full flex-col gap-1 border-l py-1 overflow-hidden",
        dayRecord.isSunday && "border-l-0",
        !dayRecord.isCurrentMonth && "opacity-50",
      )}
    >
      <div className="flex flex-col gap-1 ">
        {dayRecord.eventRecords.map((record, index) => {
          //const event = cellEvents.find((e) => e.position === position);
          const eventKey = record.event
            ? `event-${record.event.eventId}-${dayRecord.dayDate}-${index}`
            : `empty-${record.index}`;

          if (record.event) {
            return (
              <div key={eventKey} className="flex-1">
                {record.event && (
                  <MonthEventBadge
                    //className="hidden sm:flex"
                    event={record.event}
                    cellDate={startOfDay(dayRecord.dayDate)}
                    position={record.position}
                    userId={userId}
                  />
                )}
              </div>
            );
          } else {
            return (
              <div key={eventKey} className="flex-1">
                <div className={cn(eventBadgeVariants({ color: "invisible" }))}></div>
              </div>
            );
          }
        })}
      </div>
    </div>
  );
}
