import React from "react";

type CalendarDayGridContextType = {
  hours: number[] | undefined;
  currentDate: Date;
  userId?: string;
  interval: number;
  allowCreateEvent: boolean;
  isLoading: boolean;
};

export const CalendarDayGridContext = React.createContext<CalendarDayGridContextType | undefined>(undefined);

export function CalendarDayGridProvider({
  children,
  value,
}: {
  children: React.ReactNode;
  value: CalendarDayGridContextType;
}) {
  return <CalendarDayGridContext.Provider value={value}>{children}</CalendarDayGridContext.Provider>;
}

export function useCalendarDayGrid() {
  const ctx = React.useContext(CalendarDayGridContext);
  if (!ctx) throw new Error("useCalendarDayGrid must be used within CalendarDayGridProvider");
  return ctx;
}
