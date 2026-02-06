import { usePublicEventsQuery } from "@/lib/services/public";
import { useCalendarWorker } from "./use-generic-webworker";
import { useEffect, useMemo } from "react";
import { getDateRange } from "./calendar-logic-utls";
import { IEvent } from "@/lib/schemas/calendar";

export function usePublicCalendar(date: Date, roomIdList: string[]) {
  // Public view is almost always a single day view
  const range = useMemo(() => getDateRange("PUBLIC", date), [date]);

  // Fetching public-safe events
  const { data: events, isLoading, error } = usePublicEventsQuery(range.startDate, range.endDate);

  const { processEvents, data, loading: isProcessing, error: workerError } = useCalendarWorker();

  useEffect(() => {
    if (events) {
      processEvents({
        events: events as IEvent[],
        selectedDate: date,
        selectedRoomId: roomIdList,
        action: "PUBLIC",
        visibleHours: { from: 8, to: 20 },
        multiDayEventsAtTop: false,
      });
    }
  }, [events, date, roomIdList, processEvents]);

  return { data, isLoading: isLoading || isProcessing, error: error || workerError };
}
