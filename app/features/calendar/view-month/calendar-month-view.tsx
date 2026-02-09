"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { usePrivateCalendar } from "@/contexts/CalendarProviderPrivate";
import { MonthViewDayCellSkeleton } from "./skeleton-calendar-month-day-cell";
import { MonthViewDayEvents } from "./calendar-month-view-day-events";
import { MonthViewDayHeader } from "./calendar-month-view-day-header";
import { MonthViewDayFooter } from "./calendar-month-view-day-footer";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { usePrivateCalendarEvents } from "../webworkers/use-calendar-private-events";

const WEEK_DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MIN_INNER_HEIGHT = 96;
const BORDER_COMPENSATION = 2;

export function CalendarMonthView({ date, userId }: { date: Date; userId?: string }) {
  const { visibleHours, selectedRoomId, setTotalEvents, setIsHeaderLoading } = usePrivateCalendar();
  const { result, isLoading } = usePrivateCalendarEvents("MONTH", date, visibleHours, userId, selectedRoomId);

  // ✅ hooks always run
  const outerScrollRef = useRef<HTMLDivElement | null>(null);

  const weekdayHeaderRef = useRef<HTMLDivElement | null>(null);
  const weekHeaderProbeRef = useRef<HTMLDivElement | null>(null);
  const weekFooterProbeRef = useRef<HTMLDivElement | null>(null);

  const [rowContentHeight, setRowContentHeight] = useState<number>(MIN_INNER_HEIGHT);

  // safe derivations pre-render
  const weeks = result?.data.weekViews ?? [];
  const weekCount = weeks.length;

  useEffect(() => {
    if (isLoading) {
      setIsHeaderLoading(true);
      return;
    }
    if (result) {
      setIsHeaderLoading(false);
      setTotalEvents(result.totalEvents);
    }
  }, [isLoading, result, setIsHeaderLoading, setTotalEvents]);

  const recomputeHeights = useCallback(() => {
    if (!outerScrollRef.current || !weekdayHeaderRef.current || weekCount === 0) return;

    const viewport = outerScrollRef.current.querySelector<HTMLElement>("[data-radix-scroll-area-viewport]");
    if (!viewport) return;

    // ✅ This is the available height for "filling"
    const viewportH = viewport.clientHeight;

    const labelsH = weekdayHeaderRef.current.offsetHeight;
    const availableForAllWeeks = viewportH - labelsH;

    // Each week block gets this much height (header + inner + footer)
    const singleWeekBlockH = availableForAllWeeks / weekCount;

    const weekHeaderH = weekHeaderProbeRef.current?.offsetHeight ?? 0;
    const weekFooterH = weekFooterProbeRef.current?.offsetHeight ?? 0;

    const innerScrollH = singleWeekBlockH - weekHeaderH - weekFooterH;

    // ✅ enforce min 96px as requested
    setRowContentHeight(Math.max(innerScrollH - BORDER_COMPENSATION, MIN_INNER_HEIGHT - BORDER_COMPENSATION));
  }, [weekCount]);

  useLayoutEffect(() => {
    // ✅ guard inside effect, not around hooks
    if (isLoading || weekCount === 0) return;

    recomputeHeights();

    const viewport = outerScrollRef.current?.querySelector<HTMLElement>("[data-radix-scroll-area-viewport]");
    if (!viewport) return;

    const ro = new ResizeObserver(() => requestAnimationFrame(recomputeHeights));
    ro.observe(viewport);

    // if these change size due to responsive typography, etc.
    if (weekdayHeaderRef.current) ro.observe(weekdayHeaderRef.current);
    if (weekHeaderProbeRef.current) ro.observe(weekHeaderProbeRef.current);
    if (weekFooterProbeRef.current) ro.observe(weekFooterProbeRef.current);

    return () => ro.disconnect();
  }, [isLoading, recomputeHeights, weekCount]);

  // ✅ conditional render AFTER hooks
  if (isLoading || !result) return <MonthViewDayCellSkeleton date={date} />;

  return (
    // ✅ OUTER / MAIN scroll area (Option B)
    <ScrollArea ref={outerScrollRef} className="h-full w-full min-h-0">
      {/* This wrapper is the scroll content */}
      <div className="flex flex-col pr-4 ">
        {/* Weekday labels */}
        <div
          ref={weekdayHeaderRef}
          className="sticky top-0 z-20 grid grid-cols-7 border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/80  border-r"
        >
          {WEEK_DAYS.map((day) => (
            <div key={day} className="flex items-center justify-center py-2 border-l first:border-l-0">
              <span className="text-xs font-medium text-muted-foreground">{day}</span>
            </div>
          ))}
        </div>

        {/* Weeks */}
        <div className="flex flex-col border-r ">
          {weeks.map((week, weekIndex) => {
            const isProbe = weekIndex === 0;

            return (
              <div key={`week-${week.week}`} className="flex flex-col border-b last:border-b-0">
                {/* Row Header */}
                <div ref={isProbe ? weekHeaderProbeRef : undefined} className="grid grid-cols-7 shrink-0">
                  {week.dayViews.map((day, i) => (
                    <MonthViewDayHeader key={`h-${week.week}-${i}`} dayRecord={day} />
                  ))}
                </div>

                {/* Row Content (INNER scroll stays) */}
                <ScrollArea
                  type="auto"
                  className="overflow-hidden"
                  style={{ height: rowContentHeight }}
                  viewportClassName="[&>div]:h-full"
                >
                  <div className="grid grid-cols-7 min-h-full">
                    {week.dayViews.map((day) => (
                      <MonthViewDayEvents key={day.dayDate} dayRecord={day} userId={userId} />
                    ))}
                  </div>
                  <ScrollBar orientation="vertical" forceMount />
                </ScrollArea>

                {/* Row Footer */}
                <div ref={isProbe ? weekFooterProbeRef : undefined} className="grid grid-cols-7 shrink-0">
                  {week.dayViews.map((day, i) => (
                    <MonthViewDayFooter key={`f-${week.week}-${i}`} dayRecord={day} />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* MAIN scrollbar */}
      <ScrollBar orientation="vertical" forceMount />
    </ScrollArea>
  );
}
