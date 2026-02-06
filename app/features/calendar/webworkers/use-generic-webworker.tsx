import { useEffect, useRef, useState, useCallback } from "react";
import { ICalendarProcessData, IUnifiedResponse, RawCalendarData } from "./calendar-generic-webworker"; // Update path

// Define a type that maps actions to their specific data structures

export function useCalendarWorker<T>() {
  const workerRef = useRef<Worker | null>(null);
  const requestIdRef = useRef(0);

  const [data, setData] = useState<(IUnifiedResponse<T> & { error?: string }) | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<unknown>(null);

  useEffect(() => {
    // Point this to your new unified worker file
    workerRef.current = new Worker(new URL("./calendar-generic-webworker.ts", import.meta.url), { type: "module" });

    const worker = workerRef.current;

    worker.onmessage = (event: MessageEvent<ArrayBuffer>) => {
      const decoder = new TextDecoder();
      const json = decoder.decode(event.data);
      const result: IUnifiedResponse<RawCalendarData> & { requestId?: number; error?: string } = JSON.parse(json);

      if (result.requestId !== requestIdRef.current) return;

      if (result.error) {
        setError(result.error);
        setLoading(false);
        return;
      }
      let processedData = result.data as unknown as T;

      // Convert Records to Maps for UI
      if (result.data && "roomBlocks" in result.data) {
        processedData = {
          ...result.data,
          roomBlocks: new Map(Object.entries(result.data.roomBlocks)),
        } as unknown as T;
      }

      setData({
        totalEvents: result.totalEvents,
        action: result.action,
        requestId: result.requestId,
        data: processedData,
        groupingType: result.groupingType,
      });
      setLoading(false);
    };

    worker.onerror = (err) => {
      setError(err);
      setLoading(false);
    };

    return () => {
      worker.terminate();
    };
  }, []);

  const processEvents = useCallback((message: ICalendarProcessData) => {
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

  return { data: data as (IUnifiedResponse & { data: T }) | null, loading, error, processEvents };
}
