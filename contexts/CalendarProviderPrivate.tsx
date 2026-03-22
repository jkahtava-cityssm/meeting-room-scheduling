"use client";

import { createContext, useContext, useState } from "react";

import type { Dispatch, SetStateAction } from "react";

import type { TStatusKey, TVisibleHours } from "@/lib/types";
import { VISIBLE_HOURS } from "../lib/helpers";
import { usePublicConfiguration } from "@/lib/services/public";
import { useRoomsQuery } from "@/lib/services/rooms";
import { IRoom } from "@/lib/schemas";
import { usePrivateConfigurationQuery } from "@/lib/services/configuration";

interface ICalendarContext {
	selectedDate: Date;
	setSelectedDate: (date: Date | undefined) => void;
	isHeaderLoading: boolean;
	setIsHeaderLoading: (value: boolean) => void;
	totalEvents: number;
	setTotalEvents: (total: number) => void;
	selectedRoomId: string;
	setSelectedRoomId: (roomId: string) => void;
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
	//setVisibleHours: Dispatch<SetStateAction<TVisibleHours>>;
}

const CalendarContext = createContext({} as ICalendarContext);

export function CalendarProviderPrivate({ children }: { children: React.ReactNode }) {
	const {
		data: config,
		error: configurationError,
		isPending: isConfigurationPending,
	} = usePrivateConfigurationQuery(["visibleHoursStart", "visibleHoursEnd", "timeSlotInterval", "maxBookingSpan"]);

	const { data: visibleRooms, error: roomError, isPending: isRoomsPending } = useRoomsQuery();

	const visibleHours = config ? { from: config.visibleHoursStart, to: config.visibleHoursEnd } : undefined;
	const interval = config ? config.timeSlotInterval : 30;
	const maxSpan = config ? config.maxBookingSpan : 0;

	const totalFallbackHours = visibleHours ? visibleHours.to - visibleHours.from : 24;
	const minFallBackHour = visibleHours ? visibleHours.from : 0;

	const fallbackHours = Array.from({ length: totalFallbackHours }, (_, i) => i + minFallBackHour);

	const [isHeaderLoading, setIsHeaderLoading] = useState(true);
	const [totalEvents, setTotalEvents] = useState(0);
	const [selectedDate, setSelectedDate] = useState(new Date());
	const [selectedRoomId, setSelectedRoomId] = useState<string>("-1");
	const [selectedStatusKeys, setSelectedStatusKeys] = useState<TStatusKey[]>(["APPROVED", "PENDING", "INFORMATION"]);

	const handleSelectDate = (date: Date | undefined) => {
		if (!date) return;
		setSelectedDate(date);
	};

	return (
		<CalendarContext.Provider
			value={{
				isHeaderLoading,
				setIsHeaderLoading,
				totalEvents,
				setTotalEvents,
				selectedDate,
				setSelectedDate: handleSelectDate,
				selectedRoomId,
				setSelectedRoomId,
				selectedStatusKeys,
				setSelectedStatusKeys,
				visibleRooms,
				visibleHours,
				fallbackHours,
				interval,
				maxSpan,
				configurationError,
				roomError,
				isConfigurationPending,
				isRoomsPending,
			}}
		>
			{children}
		</CalendarContext.Provider>
	);
}

export function usePrivateCalendar(): ICalendarContext {
	const context = useContext(CalendarContext);
	if (!context) throw new Error("useCalendar must be used within a CalendarProvider.");
	return context;
}
