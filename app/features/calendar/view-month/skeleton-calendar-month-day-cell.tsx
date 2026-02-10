import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { getDaysInMonth, startOfMonth, subMonths } from "date-fns";
import { useCallback, useLayoutEffect, useRef, useState } from "react";

function getDays(selectedDate: Date) {
  const daysInMonth = getDaysInMonth(selectedDate);
  const beforeDays = startOfMonth(selectedDate).getDay();
  const daysInLastMonth = getDaysInMonth(subMonths(selectedDate, 1));

  const daysInLastRow = (daysInMonth + beforeDays) % 7;
  const afterDays = daysInLastRow > 0 ? 7 - daysInLastRow : 0;

  const dayList = [];

  for (let index = daysInLastMonth - beforeDays; index < daysInLastMonth; index++) {
    dayList.push({ day: index + 1, type: "before" });
  }

  for (let index = 0; index < daysInMonth; index++) {
    dayList.push({ day: index + 1, type: "current" });
  }

  for (let index = 0; index < afterDays; index++) {
    dayList.push({ day: index + 1, type: "after" });
  }

  return dayList;
}
const WEEK_DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MIN_INNER_HEIGHT = 96;
const BORDER_COMPENSATION = 2;

export function MonthViewDayCellSkeleton({ date }: { date: Date }) {
  const dayList = getDays(date);

  const outerScrollRef = useRef<HTMLDivElement | null>(null);

  const weekdayHeaderRef = useRef<HTMLDivElement | null>(null);
  const weekHeaderProbeRef = useRef<HTMLDivElement | null>(null);
  const weekFooterProbeRef = useRef<HTMLDivElement | null>(null);

  const [rowContentHeight, setRowContentHeight] = useState<number>(MIN_INNER_HEIGHT);

  // safe derivations pre-render
  const weekCount = dayList.length / 7;

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
    if (weekCount === 0) return;

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
  }, [recomputeHeights, weekCount]);

  return (
    <ScrollArea ref={outerScrollRef} className="h-full w-full min-h-0">
      <div className="flex flex-col px-4 bg-accent">
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
        <div className="grid grid-cols-7 overflow-hidden border-x bg-background">
          {dayList.map((dayRecord, index) => {
            const isSunday = index % 7 === 0;
            const isProbe = index <= 7;
            const isCurrentMonth = dayRecord.type === "current";
            return (
              <div
                key={`${dayRecord.type}-${dayRecord.day}`}
                className={cn("flex h-full flex-col border-l border-b overflow-hidden", isSunday && "border-l-0")}
              >
                <div ref={isProbe ? weekHeaderProbeRef : undefined} className="shrink-0 py-1">
                  <span
                    className={cn(
                      "flex w-8 translate-x-1 items-center justify-center h-4 px-1 text-xs font-semibold lg:px-2",
                      !isCurrentMonth && "opacity-20",
                    )}
                  >
                    {dayRecord.day}
                  </span>
                </div>

                <Skeleton
                  className={cn("flex h-6 gap-1 px-2  sm:flex-col sm:px-0", !isCurrentMonth && "opacity-50")}
                  style={{ height: rowContentHeight }}
                ></Skeleton>

                <div
                  ref={isProbe ? weekFooterProbeRef : undefined}
                  className={cn("flex w-full flex-col gap-1  py-1 overflow-hidden")}
                >
                  <div
                    className={cn(
                      "h-4.5 px-1.5 text-xs font-semibold text-muted-foreground",
                      !isCurrentMonth && "opacity-50",
                    )}
                  >
                    <Skeleton className="h-full w-full" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </ScrollArea>
  );
}
