import { useEffect, useRef, useState, useCallback } from "react";
import { IDayGridMessage, IDayGridResponse } from "./calendar-day-grid-webworker";

export function useCalendarDayGrid() {
	const workerRef = useRef<Worker | null>(null);
	const requestIdRef = useRef(0);

	const [data, setData] = useState<IDayGridResponse | null>(null);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<unknown>(null);

	// Initialize worker once
	useEffect(() => {
		workerRef.current = new Worker(new URL("./calendar-day-grid-webworker.ts", import.meta.url), { type: "module" });

		const worker = workerRef.current;

		worker.onmessage = (event: MessageEvent<IDayGridResponse & { requestId: number }>) => {
			const { requestId, ...result } = event.data;

			// Ignore stale responses
			if (requestId !== requestIdRef.current) return;

			setData(result);
			setLoading(false);
		};

		worker.onerror = err => {
			setError(err);
			setLoading(false);
		};

		return () => {
			worker.terminate();
		};
	}, []);

	// Function to send work to the worker
	const postMessage = useCallback((message: IDayGridMessage) => {
		if (!workerRef.current) return;

		setLoading(true);
		setError(null);

		const requestId = ++requestIdRef.current;

		workerRef.current.postMessage({
			...message,
			requestId,
		});
	}, []);

	return { data, loading, error, postMessage };
}
