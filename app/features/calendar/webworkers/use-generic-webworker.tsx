import { useEffect, useRef, useState, useCallback } from "react";
import {
  CalendarAction,
  CalendarDataMap,
  GroupingType,
  ICalendarProcessData,
  IDayRoomBlock,
  IEventBlock,
  IUnifiedResponse,
  IWeekData,
  ProcessedDataMap,
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
    workerRef.current = new Worker(new URL("./generic-webworker.ts", import.meta.url), { type: "module" });

    workerRef.current.onmessage = (event: MessageEvent<ArrayBuffer>) => {
      const json = new TextDecoder().decode(new Uint8Array(event.data));
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
          const dayData = result.data as IDayRoomBlock;
          // TypeScript narrows 'result.data' to TRawBlockData here
          processedData = {
            ...(dayData as IDayRoomBlock),
            roomBlocks: new Map(Object.entries(dayData.roomBlocks)),
          } as ProcessedDataMap[A];
          break;

        case "WEEK":
          const weekData = result.data as IWeekData;
          const weekMap = new Map<string, Map<string, IEventBlock[]>>();
          for (const [dateKey, roomRecord] of Object.entries(weekData.dayBlocks)) {
            weekMap.set(dateKey, new Map(Object.entries(roomRecord)));
          }

          processedData = {
            ...(weekData as IWeekData),
            dayBlocks: weekMap,
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

    const bytes = new TextEncoder().encode(JSON.stringify(payload));
    const buffer = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);

    workerRef.current.postMessage(buffer, [buffer]);
  }, []);

  return { data, loading, error, processEvents };
}
