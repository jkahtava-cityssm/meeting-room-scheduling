import { useEffect, useMemo } from "react";
import { CalendarAction, getDateRange } from "./calendar-logic-utls";
import { useEventsQuery } from "@/lib/services/events";
import { useCalendarWorker } from "./use-generic-webworker";

export function usePrivateCalendar(action: CalendarAction, date: Date, userId: string, roomId?: string | string[]) {
  const range = useMemo(() => getDateRange(action, date), [action, date]);

  // Fetching private events
  const { data: events, isLoading, error } = useEventsQuery(range.startDate, range.endDate, userId);

  const { processEvents, data, loading: isProcessing, error: workerError } = useCalendarWorker();

  useEffect(() => {
    if (events) {
      processEvents({
        events, // Type cast to IEvent[] happens inside processEvents or the worker
        selectedDate: date,
        selectedRoomId: roomId,
        action: action,
        visibleHours: { from: 7, to: 22 }, // Admin might want a wider range
        multiDayEventsAtTop: true,
      });
    }
  }, [events, action, date, roomId, processEvents]);

  return { data, isLoading: isLoading || isProcessing, error: error || workerError };
}
