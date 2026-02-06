import { useEffect, useRef, useState, useCallback } from "react";
import {
  CalendarAction,
  GroupingType,
  ICalendarProcessData,
  IUnifiedResponseUnion,
  TRawResponse,
} from "./calendar-generic-webworker"; // Update path

// Define a type that maps actions to their specific data structures

export function useCalendarWorker<A extends CalendarAction>() {
  const workerRef = useRef<Worker | null>(null);
  const requestIdRef = useRef(0);

  type SpecificResponse = Extract<IUnifiedResponseUnion, { action: A }>;

  const [data, setData] = useState<SpecificResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<unknown>(null);

  useEffect(() => {
    // Point this to your new unified worker file
    workerRef.current = new Worker(new URL("./calendar-generic-webworker.ts", import.meta.url), { type: "module" });

    workerRef.current.onmessage = (event: MessageEvent<ArrayBuffer>) => {
      const decoder = new TextDecoder();
      const json = decoder.decode(event.data);
      const result = JSON.parse(json) as TRawResponse & {
        totalEvents: number;
        groupingType: GroupingType;
        requestId?: number;
        error?: string;
      };

      if (result.requestId !== requestIdRef.current) return;

      if (result.error) {
        setError(result.error);
        setLoading(false);
        return;
      }
      let processedResponse: IUnifiedResponseUnion;

      switch (result.action) {
        case "DAY":
        case "WEEK":
        case "PUBLIC":
          // TypeScript narrows 'result.data' to TRawBlockData here
          processedResponse = {
            ...result,
            data: {
              ...result.data,
              roomBlocks: new Map(Object.entries(result.data.roomBlocks)),
            },
          };
          break;
        default:
          // MONTH, YEAR, AGENDA: result.data is already compatible
          processedResponse = result as IUnifiedResponseUnion;
          break;
      }

      setData(processedResponse as SpecificResponse);
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
