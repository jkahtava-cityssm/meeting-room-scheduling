import { useEffect, useMemo, useState } from "react";

import { useEventsQuery } from "@/lib/services/events";
import { useCalendarWorker } from "./use-generic-webworker";
import { CalendarAction } from "./calendar-generic-webworker";
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

  const { data: events, isLoading, isFetching, error } = useEventsQuery(range.startDate, range.endDate, userId);

  const { processEvents, data, loading: isProcessing, error: workerError } = useCalendarWorker<T>();

  const viewKey = `${action}|${range.startDate.toISOString()}|${range.endDate.toISOString()}`;

  const [hasProcessedForView, setHasProcessedForView] = useState(false);

  useEffect(() => {
    setHasProcessedForView(false);
  }, [viewKey]);

  useEffect(() => {
    if (!events) return;
    processEvents({
      events: events as IEvent[],
      selectedDate: date,
      selectedRoomId: roomId,
      action: action,
      visibleHours,
      multiDayEventsAtTop: true,
    });
  }, [events, action, date, roomId, processEvents, visibleHours]);

  useEffect(() => {
    if (!isProcessing && data) {
      setHasProcessedForView(true);
    }
  }, [isProcessing, data]);

  return {
    result: data,
    isLoading: isLoading || !hasProcessedForView,
    isRefetching: isFetching && !isLoading,
    isBackgroundProcessing: hasProcessedForView && isProcessing,
    error: error || workerError,
  };
}
