"use client";

import { createContext, useContext, useState } from "react";

import type { Dispatch, SetStateAction } from "react";

import type { TVisibleHours } from "@/lib/types";
import { VISIBLE_HOURS } from "../lib/helpers";
import { PUBLIC_IROOM, usePublicConfiguration, usePublicRoomsQuery } from "@/lib/services/public";
import { useRoomsQuery } from "@/lib/services/rooms";
import { IRoom } from "@/lib/schemas/calendar";

interface ICalendarContext {
	selectedDate: Date;
	setSelectedDate: (date: Date | undefined) => void;
	selectedRoomId: string;
	setSelectedRoomId: (roomId: string) => void;
	visibleRooms: PUBLIC_IROOM[] | undefined;
	visibleHours: TVisibleHours | undefined;
	fallbackHours: number[];
	interval: number;
	configurationError: Error | null;
	roomError: Error | null;
	isConfigurationPending: boolean;
	isRoomsPending: boolean;
	//setVisibleHours: Dispatch<SetStateAction<TVisibleHours>>;
}

const CalendarContext = createContext({} as ICalendarContext);

export function CalendarProviderPublic({ children }: { children: React.ReactNode }) {
	const { data: configurationData, error: configurationError, isPending: isConfigurationPending } = usePublicConfiguration();
	const { data: visibleRooms, error: roomError, isPending: isRoomsPending } = usePublicRoomsQuery();

	const visibleHours = configurationData ? configurationData.hours : undefined;
	const interval = configurationData ? configurationData.interval : 30;

	const totalFallbackHours = visibleHours ? visibleHours.to - visibleHours.from : 24;
	const minFallBackHour = visibleHours ? visibleHours.from : 1;

	const fallbackHours = Array.from({ length: totalFallbackHours }, (_, i) => i + minFallBackHour);

	const [isHeaderLoading, setIsHeaderLoading] = useState(true);
	const [totalEvents, setTotalEvents] = useState(0);
	const [selectedDate, setSelectedDate] = useState(new Date());
	const [selectedRoomId, setSelectedRoomId] = useState<string>("-1");

	const handleSelectDate = (date: Date | undefined) => {
		if (!date) return;
		setSelectedDate(date);
	};

	return (
		<CalendarContext.Provider
			value={{
				selectedDate,
				setSelectedDate: handleSelectDate,
				selectedRoomId,
				setSelectedRoomId,
				visibleRooms,
				visibleHours,
				fallbackHours,
				interval,
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

export function usePublicCalendar(): ICalendarContext {
	const context = useContext(CalendarContext);
	if (!context) throw new Error("useCalendar must be used within a CalendarProvider.");
	return context;
}
