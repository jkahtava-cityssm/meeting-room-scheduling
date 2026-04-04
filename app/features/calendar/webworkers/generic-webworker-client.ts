import { ICalendarProcessData, IUnifiedResponse, CalendarAction, ProcessedDataMap } from './generic-webworker';

// Maintain state outside the function to persist across re-renders
let worker: Worker | null = null;
let requestIdCounter = 0;

type WorkerSuccessResponse<A extends CalendarAction = CalendarAction> = {
  action: A;
  totalEvents: number;
  data: ProcessedDataMap[A];
};

// Replace 'Function' with specific signatures
type ResolverEntry = {
  resolve: (value: WorkerSuccessResponse) => void;
  reject: (reason: unknown) => void;
};

const resolvers = new Map<number, ResolverEntry>();

const getWorker = () => {
  if (typeof window === 'undefined') return null; // SSR safety

  if (!worker) {
    worker = new Worker(new URL('./generic-webworker.ts', import.meta.url), { type: 'module' });

    worker.onmessage = (event: MessageEvent<ArrayBuffer>) => {
      const json = new TextDecoder().decode(new Uint8Array(event.data));
      const result = JSON.parse(json) as IUnifiedResponse<CalendarAction>;

      const resolver = resolvers.get(result.requestId);
      if (resolver) {
        if (result.error) {
          resolver.reject(result.error);
        } else {
          // Returning the data exactly as it comes from the worker (No Map conversion)
          resolver.resolve({
            action: result.action,
            totalEvents: result.totalEvents,
            data: result.data as ProcessedDataMap[CalendarAction],
          });
        }
        resolvers.delete(result.requestId);
      }
    };

    worker.onerror = (err) => {
      // Reject all pending requests if the worker crashes
      resolvers.forEach((r) => r.reject(err));
      resolvers.clear();
      worker = null; // Reset for next attempt
    };
  }
  return worker;
};

export const processEventsAsync = <A extends CalendarAction>(
  message: Omit<ICalendarProcessData, 'action' | 'requestId'> & { action: A },
): Promise<{ action: A; totalEvents: number; data: ProcessedDataMap[A] }> => {
  return new Promise((resolve, reject) => {
    const workerInstance = getWorker();
    if (!workerInstance) return reject('Worker not available');

    const requestId = ++requestIdCounter;
    resolvers.set(requestId, { resolve: resolve as (value: WorkerSuccessResponse) => void, reject });

    const payload = { ...message, requestId };
    const bytes = new TextEncoder().encode(JSON.stringify(payload));
    const buffer = bytes.buffer;

    workerInstance.postMessage(buffer, [buffer]);
  });
};
