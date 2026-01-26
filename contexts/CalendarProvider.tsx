"use client";

import { createContext, useContext, useState } from "react";

import type { Dispatch, SetStateAction } from "react";

import type { TVisibleHours, TWorkingHours } from "@/lib/types";
import { VISIBLE_HOURS } from "../lib/helpers";
import { usePublicConfiguration } from "@/lib/services/public";
import { useRoomsQuery } from "@/lib/services/rooms";
import { IRoom } from "@/lib/schemas/calendar";

interface ICalendarContext {
	selectedDate: Date;
	setSelectedDate: (date: Date | undefined) => void;
	isHeaderLoading: boolean;
	setIsHeaderLoading: (value: boolean) => void;
	totalEvents: number;
	setTotalEvents: (total: number) => void;
	selectedRoomId: string;
	setSelectedRoomId: (roomId: string) => void;
	visibleRooms: IRoom[] | undefined;
	visibleHours: TVisibleHours;
	interval: number;
	//setVisibleHours: Dispatch<SetStateAction<TVisibleHours>>;
}

const CalendarContext = createContext({} as ICalendarContext);

export function CalendarProvider({ children }: { children: React.ReactNode }) {
	const { data: configurationData } = usePublicConfiguration();
	const { data: visibleRooms } = useRoomsQuery();

	const visibleHours: TVisibleHours = configurationData ? configurationData.hours : VISIBLE_HOURS;
	const interval = configurationData ? configurationData.interval : 30;

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
				isHeaderLoading,
				setIsHeaderLoading,
				totalEvents,
				setTotalEvents,
				selectedDate,
				setSelectedDate: handleSelectDate,
				selectedRoomId,
				setSelectedRoomId,
				visibleRooms,
				visibleHours,
				interval,
			}}
		>
			{children}
		</CalendarContext.Provider>
	);
}

export function useCalendar(): ICalendarContext {
  const context = useContext(CalendarContext);
  if (!context) throw new Error("useCalendar must be used within a CalendarProvider.");
  return context;
}
