"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";

import type { Dispatch, SetStateAction } from "react";

import type { TStatusKey, TVisibleHours } from "@/lib/types";
import { VISIBLE_HOURS } from "../lib/helpers";
import { usePublicConfiguration } from "@/lib/services/public";
import { useRoomsQuery } from "@/lib/services/rooms";
import { IRoom } from "@/lib/schemas";
import { usePrivateConfigurationQuery } from "@/lib/services/configuration";
import { useStatusQuery } from "@/lib/services/status";

interface ICalendarContext {
	selectedDate: Date;
	setSelectedDate: (date: Date | undefined) => void;
	isHeaderLoading: boolean;
	setIsHeaderLoading: (value: boolean) => void;
	totalEvents: number;
	setTotalEvents: (total: number) => void;
	selectedRoomIds: string[];
	setSelectedRoomIds: (roomIds: string[]) => void;
	selectedStatusKeys: TStatusKey[];
	setSelectedStatusKeys: (statusIds: TStatusKey[]) => void;
	visibleRooms: IRoom[] | undefined;
	visibleHours: TVisibleHours | undefined;
	fallbackHours: number[];
	interval: number;
	maxSpan: number;
	configurationError: Error | null;
	roomError: Error | null;
	isConfigurationPending: boolean;
	isRoomsPending: boolean;
	statusLookup: (key: TStatusKey) => number | undefined;
}

const CalendarContext = createContext<ICalendarContext | null>(null);

export function CalendarProviderPrivate({ children }: { children: React.ReactNode }) {
	const {
		data: config,
		error: configurationError,
		isPending: isConfigurationPending,
	} = usePrivateConfigurationQuery(["visibleHoursStart", "visibleHoursEnd", "timeSlotInterval", "maxBookingSpan"]);

	const { data: visibleRooms, error: roomError, isPending: isRoomsPending } = useRoomsQuery();
	const { data: statuses, error: statusError, isPending: isStatusPending } = useStatusQuery();

	const [isHeaderLoading, setIsHeaderLoading] = useState(true);
	const [totalEvents, setTotalEvents] = useState(0);
	const [selectedDate, setSelectedDate] = useState(new Date());
	const [selectedRoomIds, setSelectedRoomIds] = useState<string[]>(["-1"]);
	const [selectedStatusKeys, setSelectedStatusKeys] = useState<TStatusKey[]>(["APPROVED", "PENDING", "INFORMATION"]);

	const visibleHours = useMemo(() => (config ? { from: config.visibleHoursStart, to: config.visibleHoursEnd } : undefined), [config]);

	const fallbackHours = useMemo(() => {
		const totalFallbackHours = visibleHours ? visibleHours.to - visibleHours.from : 24;
		const minFallBackHour = visibleHours ? visibleHours.from : 0;
		return Array.from({ length: totalFallbackHours }, (_, i) => i + minFallBackHour);
	}, [visibleHours]);

	const statusLookup = useCallback(
		(key: TStatusKey) => {
			return statuses?.find(s => s.key === key)?.statusId;
		},
		[statuses],
	);

	const handleSelectDate = useCallback((date: Date | undefined) => {
		if (!date) return;
		setSelectedDate(date);
	}, []);

	const value = useMemo(
		() => ({
			isHeaderLoading,
			setIsHeaderLoading,
			totalEvents,
			setTotalEvents,
			selectedDate,
			setSelectedDate: handleSelectDate,
			selectedRoomIds,
			setSelectedRoomIds,
			selectedStatusKeys,
			setSelectedStatusKeys,
			statusLookup,
			visibleRooms,
			visibleHours,
			fallbackHours,
			interval: config?.timeSlotInterval ?? 30,
			maxSpan: config?.maxBookingSpan ?? 0,
			configurationError,
			roomError,
			isConfigurationPending,
			isRoomsPending,
		}),
		[
			isHeaderLoading,
			totalEvents,
			selectedDate,
			handleSelectDate,
			selectedRoomIds,
			selectedStatusKeys,
			statusLookup,
			visibleRooms,
			visibleHours,
			fallbackHours,
			config?.timeSlotInterval,
			config?.maxBookingSpan,
			configurationError,
			roomError,
			isConfigurationPending,
			isRoomsPending,
		],
	);

	return <CalendarContext.Provider value={value}>{children}</CalendarContext.Provider>;
}

export function usePrivateCalendar(): ICalendarContext {
	const context = useContext(CalendarContext);
	if (!context) throw new Error("usePrivateCalendar must be used within a CalendarProviderPrivate.");
	return context;
}
