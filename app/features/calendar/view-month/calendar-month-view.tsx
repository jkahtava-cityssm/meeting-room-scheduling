"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { usePrivateCalendar } from "@/contexts/CalendarProviderPrivate";
import { MonthViewDayCellSkeleton } from "./skeleton-calendar-month-day-cell";
import { MonthViewDayEvents } from "./calendar-month-view-day-events";

import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { usePrivateCalendarEvents } from "../webworkers/use-calendar-private-events";
import { LoaderCircle } from "lucide-react";

import { cn } from "@/lib/utils";
import { IMonthDayView } from "../webworkers/generic-webworker";
import { Button } from "@/components/ui/button";
import { navigateURL } from "@/lib/helpers";
import { useRouter } from "next/navigation";

const WEEK_DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MIN_INNER_HEIGHT = 96;
const BORDER_COMPENSATION = 2;

export function CalendarMonthView({ date, userId }: { date: Date; userId?: string }) {
  const { visibleHours, selectedRoomId, setTotalEvents, setIsHeaderLoading } = usePrivateCalendar();
  const { result, isLoading } = usePrivateCalendarEvents("MONTH", date, visibleHours, userId, selectedRoomId);

  //  hooks always run
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

    // This is the available height for "filling"
    const viewportH = viewport.clientHeight;

    const labelsH = weekdayHeaderRef.current.offsetHeight;
    const availableForAllWeeks = viewportH - labelsH;

    // Each week block gets this much height (header + inner + footer)
    const singleWeekBlockH = availableForAllWeeks / weekCount;

    const weekHeaderH = weekHeaderProbeRef.current?.offsetHeight ?? 0;
    const weekFooterH = weekFooterProbeRef.current?.offsetHeight ?? 0;

    const innerScrollH = singleWeekBlockH - weekHeaderH - weekFooterH;

    // enforce min 96px as requested
    setRowContentHeight(Math.max(innerScrollH - BORDER_COMPENSATION, MIN_INNER_HEIGHT - BORDER_COMPENSATION));
  }, [weekCount]);

  useLayoutEffect(() => {
    // guard inside effect, not around hooks
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

  //  conditional render AFTER hooks

  const isMounting = !result;
  if (isMounting) return <MonthViewDayCellSkeleton date={date} />;

  return (
    //  OUTER / MAIN scroll area (Option B)
    <ScrollArea ref={outerScrollRef} className="h-full w-full min-h-0">
      {/* This wrapper is the scroll content */}
      <div className="flex flex-col px-4 bg-accent">
        {/* Weekday labels */}
        <div
          ref={weekdayHeaderRef}
          className="sticky top-0 z-20 grid grid-cols-7 border-b bg-background backdrop-blur supports-backdrop-filter:bg-background/80 border-x"
        >
          {WEEK_DAYS.map((day) => (
            <div key={day} className="flex items-center justify-center py-2 border-l first:border-l-0">
              <span className="text-xs font-medium text-muted-foreground">{day}</span>
            </div>
          ))}
        </div>

        {/* Weeks */}
        <div className="flex flex-col border-x  bg-background">
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
                  <div className="grid grid-cols-7 min-h-full h-full">
                    {week.dayViews.map((day) => (
                      <MonthViewDayEvents key={day.dayDate} isLoading={isLoading} dayRecord={day} userId={userId} />
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
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="flex flex-col bg-accent-foreground text-accent px-4 py-2 rounded ">
            <LoaderCircle className="animate-spin" />
          </div>
        </div>
      )}
      {/* MAIN scrollbar */}
      <ScrollBar orientation="vertical" forceMount />
    </ScrollArea>
  );
}

export function MonthViewDayFooter({ dayRecord }: { dayRecord: IMonthDayView }) {
  return (
    <div className={cn("flex h-full flex-col gap-1 border-l py-1 overflow-hidden", dayRecord.isSunday && "border-l-0")}>
      <p
        className={cn(
          "h-4.5 px-1.5 text-xs font-semibold text-muted-foreground",
          !dayRecord.isCurrentMonth && "opacity-50",
        )}
      >
        {dayRecord.totalEvents > 0 && <span className="sm:hidden">+{dayRecord.totalEvents}</span>}
        {dayRecord.totalEvents > 3 && <span className="hidden sm:block"> {dayRecord.totalEvents} events</span>}
      </p>
    </div>
  );
}

export function MonthViewDayHeader({ dayRecord }: { dayRecord: IMonthDayView }) {
  const { push } = useRouter();

  const handleClick = () => {
    push(navigateURL(new Date(dayRecord.dayDate), "day"));
  };

  return (
    <div className={cn("flex h-full flex-col gap-1 border-l py-1 overflow-hidden", dayRecord.isSunday && "border-l-0")}>
      <Button
        variant={"ghost"}
        className={cn(
          "flex w-8 translate-x-1 items-center justify-center h-4 px-1 text-xs font-semibold lg:px-2",
          !dayRecord.isCurrentMonth && "opacity-20 hover:bg-primary/20",
          dayRecord.isToday && "rounded-full bg-primary px-0 font-bold text-primary-foreground",
        )}
        onClick={handleClick}
      >
        {dayRecord.day}
      </Button>
    </div>
  );
}
