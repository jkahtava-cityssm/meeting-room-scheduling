"use client";
import { format } from "date-fns";
import { useEffect, useState } from "react";
import { useCalendar } from "@/contexts/CalendarProvider";
import { TVisibleHours } from "@/lib/types";
import { roundToPrecision } from "@/lib/helpers";

export function CalendarTimeline() {
  const { visibleHours } = useCalendar();

  //The date is not initially set because the server and clients time is not always consistent.
  //because this component updates on the minute if the state is initially set it will throw a hydration error
  //when getting close to the next minute so at 00:00:55 it will cross to the next minute boundary while hydrating causing a mismatch
  const [currentTime, setCurrentTime] = useState<Date | null>(null);

  useEffect(() => {
    setCurrentTime(new Date());
    const timer = setInterval(() => setCurrentTime(new Date()), 60 * 1000);
    return () => clearInterval(timer);
  }, []);

  if (!currentTime) return null;

  const currentHour = currentTime.getHours();
  if (currentHour < visibleHours.from || currentHour >= visibleHours.to) return null;

  return (
    <div
      className="pointer-events-none absolute inset-x-0 z-50 border-t border-primary"
      style={{ top: `${getCurrentTimePosition(currentTime, visibleHours)}%` }}
    >
      <div className="absolute left-0 top-0 size-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary"></div>
      <div className="absolute -left-18 flex w-16 -translate-y-1/2 justify-end bg-background pr-1 text-xs font-medium text-primary">
        {format(currentTime, "h:mm a")}
      </div>
    </div>
  );
}

const getCurrentTimePosition = (currentTime: Date, visibleHours: TVisibleHours) => {
  const minutes = currentTime.getHours() * 60 + currentTime.getMinutes();

  const visibleStartMinutes = visibleHours.from * 60;
  const visibleEndMinutes = visibleHours.to * 60;
  const visibleRangeMinutes = visibleEndMinutes - visibleStartMinutes;
  const calculatedPosition = ((minutes - visibleStartMinutes) / visibleRangeMinutes) * 100;

  return roundToPrecision(calculatedPosition, 2);
};
