import { useEffect, useRef, useState, useCallback } from 'react';
import { CalendarAction, ICalendarProcessData, IRequestSection, IUnifiedResponse, ProcessedDataMap } from './generic-webworker';

type CalendarState<A extends CalendarAction> = {
  action: A;
  totalEvents: number;
  requestId?: number;
  data: ProcessedDataMap[A] | { requestSections: IRequestSection[] };
};

export function useCalendarWorker<A extends CalendarAction>() {
  const workerRef = useRef<Worker | null>(null);
  const requestIdRef = useRef(0);

  const [data, setData] = useState<CalendarState<A> | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    workerRef.current = new Worker(new URL('./generic-webworker.ts', import.meta.url), { type: 'module' });

    workerRef.current.onmessage = (event: MessageEvent<ArrayBuffer>) => {
      const result = (() => {
        if (event.data instanceof ArrayBuffer) {
          const json = new TextDecoder().decode(new Uint8Array(event.data));
          return JSON.parse(json) as IUnifiedResponse<A>;
        }
        return event.data;
      })();

      if (result.requestId !== requestIdRef.current) return;

      if (result.error) {
        setError(new Error(result.error));
        setLoading(false);
        return;
      }

      setData({
        action: result.action,
        totalEvents: result.totalEvents,
        requestId: result.requestId,
        data: result.data,
        viewType: result.viewType ?? 'calendar',
      } as CalendarState<A>); //as CalendarState<A>
      setLoading(false);
    };

    workerRef.current.onerror = (err) => {
      if (err.error instanceof Error) {
        setError(err.error);
      } else {
        const newError = new Error(err.message || 'Unknown Worker Error');
        newError.name = 'WebWorkerError';

        setError(newError);
      }

      setLoading(false);
    };

    return () => {
      workerRef.current?.terminate();
    };
  }, []);

  const processEvents = useCallback((message: Omit<ICalendarProcessData, 'action' | 'requestId'> & { action: A }) => {
    if (!workerRef.current) return;
    setLoading(true);
    setError(null);

    const requestId = ++requestIdRef.current;

    workerRef.current.postMessage({ ...message, requestId });
  }, []);

  return { data, loading, error, processEvents };
}
