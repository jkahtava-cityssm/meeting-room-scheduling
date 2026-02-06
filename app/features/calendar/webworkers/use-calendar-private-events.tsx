import { useEffect, useMemo } from "react";

import { useEventsQuery } from "@/lib/services/events";
import { useCalendarWorker } from "./use-generic-webworker";
import { CalendarAction, IUnifiedResponseUnion, TCalendarResponse } from "./calendar-generic-webworker";
import { IEvent } from "@/lib/schemas/calendar";
import { TVisibleHours } from "@/lib/types";
import { getDateRange } from "./calendar-logic-utls";

export function usePrivateCalendar<T extends CalendarAction>(
  action: T,
  date: Date,
  visibleHours: TVisibleHours,
  userId?: string,
  roomId?: string | string[],
) {
  const range = useMemo(() => getDateRange(action, date), [action, date]);

  // Fetching private events
  const { data: events, isLoading, error } = useEventsQuery(range.startDate, range.endDate, userId);

  const { processEvents, data, loading: isProcessing, error: workerError } = useCalendarWorker<T>();

  useEffect(() => {
    if (events) {
      processEvents({
        events: events as IEvent[],
        selectedDate: date,
        selectedRoomId: roomId,
        action: action,
        visibleHours,
        multiDayEventsAtTop: true,
      });
    }
  }, [events, action, date, roomId, processEvents, visibleHours]);

  return {
    result: data as Extract<IUnifiedResponseUnion, { action: T }> | null,
    isLoading: isLoading || isProcessing,
    error: error || workerError,
  };
}
