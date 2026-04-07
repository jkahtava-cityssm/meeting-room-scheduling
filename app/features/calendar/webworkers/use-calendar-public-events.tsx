import { usePublicEventsQuery } from '@/lib/services/public';
import { useCalendarWorker } from './use-generic-webworker';
import { useEffect, useState } from 'react';
import { IEventSingleRoom } from '@/lib/schemas';
import { CalendarAction, IRequestSection, ISODateString, ProcessedDataMap } from './generic-webworker';
import { TVisibleHours } from '@/lib/types';

export function usePublicCalendarEvents<T extends CalendarAction, V extends 'calendar' | 'booking' = 'calendar'>(
  action: T,
  date: Date,
  roomIdList: string[],
  visibleHours: TVisibleHours | undefined,
) {
  const { data: events, isPending, isLoading, isFetching, error } = usePublicEventsQuery(date);

  const { processEvents, data, loading: isProcessing, error: workerError } = useCalendarWorker<T>();

  const viewKey = `${action}|${date.toISOString()}`;

  const [hasProcessedForView, setHasProcessedForView] = useState(false);

  useEffect(() => {
    setHasProcessedForView(false);
  }, [viewKey]);

  useEffect(() => {
    if (!events || !visibleHours) return;

    processEvents({
      events: events as IEventSingleRoom[],
      selectedDate: date.toISOString() as ISODateString,
      selectedRoomId: roomIdList,
      action: action,
      visibleHours: visibleHours,
      multiDayEventsAtTop: false,
      statusKeys: ['APPROVED', 'PENDING', 'INFORMATION'],
      viewType: 'calendar',
    });
  }, [action, events, date, roomIdList, visibleHours, processEvents]);

  useEffect(() => {
    if (!isProcessing && data) {
      setHasProcessedForView(true);
    }
  }, [isProcessing, data]);

  return {
    result: data as unknown as CalendarState<T, V>,
    isLoading: isLoading || !hasProcessedForView,

    isRefetching: isFetching && !isLoading,
    isBackgroundProcessing: hasProcessedForView && isProcessing,
    error: error || workerError,
  };
}

type CalendarState<A extends CalendarAction, V extends 'calendar' | 'booking'> = {
  action: A;
  totalEvents: number;
  requestId?: number;
  viewType: V;
  data: V extends 'booking' ? { requestSections: IRequestSection[] } : ProcessedDataMap[A];
};
