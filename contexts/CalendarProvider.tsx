"use client";

import { createContext, useContext, useState } from "react";

import type { Dispatch, SetStateAction } from "react";

import type { TVisibleHours, TWorkingHours } from "@/lib/types";
import { VISIBLE_HOURS } from "../lib/helpers";
import { usePublicConfigurationsQuery } from "@/services/public";

interface ICalendarContext {
  selectedDate: Date;
  setSelectedDate: (date: Date | undefined) => void;
  isHeaderLoading: boolean;
  setIsHeaderLoading: (value: boolean) => void;
  totalEvents: number;
  setTotalEvents: (total: number) => void;
  selectedRoomId: string;
  setSelectedRoomId: (roomId: string) => void;
  workingHours: TWorkingHours;
  setWorkingHours: Dispatch<SetStateAction<TWorkingHours>>;
  visibleHours: TVisibleHours;
  //setVisibleHours: Dispatch<SetStateAction<TVisibleHours>>;
}

const CalendarContext = createContext({} as ICalendarContext);

const WORKING_HOURS = {
  0: { from: 0, to: 0 },
  1: { from: 8, to: 17 },
  2: { from: 8, to: 17 },
  3: { from: 8, to: 17 },
  4: { from: 8, to: 17 },
  5: { from: 8, to: 17 },
  6: { from: 8, to: 12 },
};

export function CalendarProvider({ children }: { children: React.ReactNode }) {
  //const [visibleHours, setVisibleHours] = useState<TVisibleHours>(VISIBLE_HOURS);
  const [workingHours, setWorkingHours] = useState<TWorkingHours>(WORKING_HOURS);

  const { data: visibleHours } = usePublicConfigurationsQuery();

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
        visibleHours,
        //setVisibleHours,
        workingHours,
        setWorkingHours,
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
