import { useEffect, useRef, useState, useCallback } from "react";
import {
	CalendarAction,
	CalendarDataMap,
	GroupingType,
	ICalendarProcessData,
	IUnifiedResponse,
	ProcessedDataMap,
	TRawBlockData,
} from "./generic-webworker";

type CalendarState<A extends CalendarAction> = {
  action: A;
  totalEvents: number;
  groupingType: GroupingType;
  requestId?: number;
  data: ProcessedDataMap[A];
};

export function useCalendarWorker<A extends CalendarAction>() {
  const workerRef = useRef<Worker | null>(null);
  const requestIdRef = useRef(0);

  const [data, setData] = useState<CalendarState<A> | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<unknown>(null);

  useEffect(() => {
    workerRef.current = new Worker(new URL("./calendar-generic-webworker.ts", import.meta.url), { type: "module" });

    workerRef.current.onmessage = (event: MessageEvent<ArrayBuffer>) => {
      const decoder = new TextDecoder();
      const json = decoder.decode(event.data);
      const result = JSON.parse(json) as IUnifiedResponse<A>;

      if (result.requestId !== requestIdRef.current) return;

      if (result.error) {
        setError(result.error);
        setLoading(false);
        return;
      }
      let processedData: ProcessedDataMap[A];

      switch (result.action) {
        case "DAY":
        case "WEEK":
        case "PUBLIC":
          const rawData = result.data as TRawBlockData;
          // TypeScript narrows 'result.data' to TRawBlockData here
          processedData = {
            ...(rawData as TRawBlockData),
            roomBlocks: new Map(Object.entries(rawData.roomBlocks)),
          } as ProcessedDataMap[A];
          break;
        default:
          // MONTH, YEAR, AGENDA: result.data is already compatible
          processedData = result.data as ProcessedDataMap[A];
          break;
      }

      setData({
        action: result.action,
        totalEvents: result.totalEvents,
        groupingType: result.groupingType,
        requestId: result.requestId,
        data: processedData,
      } as CalendarState<A>);
      setLoading(false);
    };

    workerRef.current.onerror = (err) => {
      setError(err);
      setLoading(false);
    };

    return () => {
      workerRef.current?.terminate();
    };
  }, []);

  const processEvents = useCallback((message: Omit<ICalendarProcessData, "action"> & { action: A }) => {
    if (!workerRef.current) return;
    setLoading(true);
    setError(null);

    const requestId = ++requestIdRef.current;
    const payload = { ...message, requestId };

    // Encode to Buffer
    const encoder = new TextEncoder();
    const buffer = encoder.encode(JSON.stringify(payload)).buffer;

    workerRef.current.postMessage(buffer, [buffer]);
  }, []);

  return { data, loading, error, processEvents };
}
