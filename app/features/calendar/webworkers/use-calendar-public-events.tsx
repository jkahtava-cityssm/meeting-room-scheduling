import { usePublicEventsQuery } from "@/lib/services/public";
import { useCalendarWorker } from "./use-generic-webworker";
import { useEffect, useState } from "react";
import { IEvent } from "@/lib/schemas";
import { CalendarAction, ISODateString } from "./generic-webworker";
import { TVisibleHours } from "@/lib/types";

export function usePublicCalendarEvents<T extends CalendarAction>(
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
			events: events as IEvent[],
			selectedDate: date.toISOString() as ISODateString,
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
