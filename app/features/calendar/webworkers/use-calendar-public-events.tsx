import { usePublicEventsQuery } from "@/lib/services/public";
import { useCalendarWorker } from "./use-generic-webworker";
import { useEffect, useMemo } from "react";
import { IEvent } from "@/lib/schemas/calendar";
import { CalendarAction, IUnifiedResponseUnion, TCalendarResponse } from "./calendar-generic-webworker";
import { TVisibleHours } from "@/lib/types";
import { getDateRange } from "./calendar-logic-utls";

export function usePublicCalendar<T extends CalendarAction>(
  action: T,
  date: Date,
  roomIdList: string[],
  visibleHours: TVisibleHours,
) {
  // Public view is almost always a single day view
  const range = useMemo(() => getDateRange(action, date), [action, date]);

  // Fetching public-safe events
  const { data: events, isLoading, error } = usePublicEventsQuery(range.startDate, range.endDate);

  const { processEvents, data, loading: isProcessing, error: workerError } = useCalendarWorker<T>();

  useEffect(() => {
    if (events) {
      processEvents({
        events: events as IEvent[],
        selectedDate: date,
        selectedRoomId: roomIdList,
        action: action,
        visibleHours: visibleHours,
        multiDayEventsAtTop: false,
      });
    }
  }, [action, events, date, roomIdList, visibleHours, processEvents]);

  return {
    result: data as Extract<IUnifiedResponseUnion, { action: T }> | null,
    isLoading: isLoading || isProcessing,
    error: error || workerError,
  };
}
