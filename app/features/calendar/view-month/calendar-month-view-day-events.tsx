import { startOfDay } from "date-fns";
import { eventBadgeVariants, MonthEventBadge } from "@/app/features/calendar/view-month/calendar-month-event-badge";
import { cn } from "@/lib/utils";
import { IMonthDayView } from "../webworkers/generic-webworker";

import { useCallback } from "react";
import { useSharedEventDrawer } from "../../event-drawer/drawer-context";

export function MonthViewDayEvents({
  dayRecord,
  userId,
  isLoading,
  readEventAllowed,
}: {
  dayRecord: IMonthDayView;
  userId?: string;
  isLoading: boolean;
  readEventAllowed: boolean;
}) {
  const { openEventDrawer } = useSharedEventDrawer();

  return (
    <div
      className={cn(
        "flex h-full flex-col gap-1 border-l py-1 overflow-hidden",
        dayRecord.isSunday && "border-l-0",
        !dayRecord.isCurrentMonth && "opacity-50",
      )}
    >
      <div className="flex flex-col gap-1 ">
        {!isLoading &&
          dayRecord.eventRecords.map((record, index) => {
            //const event = cellEvents.find((e) => e.position === position);
            const eventKey = record.event
              ? `event-${record.event.eventId}-${dayRecord.dayDate}`
              : `empty-${record.index}`;

            if (record.event) {
              return (
                <div key={eventKey} className="flex w-full min-w-0 ">
                  {record.event && (
                    <MonthEventBadge
                      event={record.event}
                      cellDate={startOfDay(dayRecord.dayDate)}
                      position={record.position}
                      userId={userId}
                      onClick={(e) => {
                        // e.preventDefault();
                        if (!readEventAllowed) return;
                        openEventDrawer({
                          creationDate: new Date(record.event!.startDate),
                          event: record.event,
                          userId,
                        });
                      }}
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
