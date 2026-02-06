import { usePublicEventsQuery } from "@/lib/services/public";
import { useCalendarWorker } from "./use-generic-webworker";
import { useEffect, useMemo, useRef, useState } from "react";
import { IEvent } from "@/lib/schemas/calendar";
import { CalendarAction } from "./calendar-generic-webworker";
import { TVisibleHours } from "@/lib/types";
import { getDateRange } from "./calendar-logic-utls";

export function usePublicCalendar<T extends CalendarAction>(
  action: T,
  date: Date,
  roomIdList: string[],
  visibleHours: TVisibleHours,
) {
  const range = useMemo(() => getDateRange(action, date), [action, date]);

  const { data: events, isLoading, isFetching, error } = usePublicEventsQuery(range.startDate, range.endDate);

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
      selectedRoomId: roomIdList,
      action: action,
      visibleHours: visibleHours,
      multiDayEventsAtTop: false,
    });
  }, [action, events, date, roomIdList, visibleHours, processEvents]);

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
