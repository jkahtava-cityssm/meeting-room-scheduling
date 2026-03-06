// calendar-scroll-context.tsx
import { createContext, useContext, RefObject } from "react";

const CalendarScrollContext = createContext<{
  viewport: HTMLDivElement | null;
  popoverLayer: HTMLDivElement | null;
} | null>(null);

export const CalendarScrollProvider = CalendarScrollContext.Provider;

export const useCalendarViewport = () => {
  const context = useContext(CalendarScrollContext);
  if (!context) {
    throw new Error("useCalendarViewport must be used within a CalendarScrollProvider");
  }
  return context;
};
