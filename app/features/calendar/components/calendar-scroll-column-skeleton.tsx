import { cn } from "@/lib/utils";

import { useMemo } from "react";

import { TIME_BLOCK_SIZE } from "@/lib/types";

import { Skeleton } from "@/components/ui/skeleton";

export function CalendarScrollColumnSkeleton({ hours, isLastColumn }: { hours: number[]; isLastColumn: boolean }) {
  const totalBlocks = 2;
  const middleBlock = useMemo(() => Math.max(0, Math.floor(totalBlocks / 2) - 1), [totalBlocks]);
  return (
    <div className={cn("min-w-45 w-full border-b-2", isLastColumn && "border-r-2")}>
      <div className="sticky top-0 z-5 bg-background border-b-2 h-8 flex items-center justify-center">
        <div className="w-full h-full py-1 px-5">
          <Skeleton className="h-full w-full"></Skeleton>
        </div>
      </div>
      <div className="relative border-t-6 border-b-16">
        {hours?.map((hour, index) => {
          return (
            <div
              key={hour}
              className="grid w-full h-24 relative"
              style={{
                gridTemplateRows: `repeat(${totalBlocks}, 1fr)`,
                contentVisibility: "auto",
                containIntrinsicSize: `auto ${TIME_BLOCK_SIZE}px`,
              }}
            >
              {index !== 0 && <div className="pointer-events-none absolute inset-x-0 top-0 border-b-2"></div>}
              {Array.from({ length: totalBlocks }, (_, blockIndex) => {
                return (
                  <div key={blockIndex} className={cn("relative")} style={{ height: `${TIME_BLOCK_SIZE}px` }}>
                    {blockIndex !== 0 && <div className="pointer-events-none absolute inset-x-0 top-0 border-b"></div>}
                    <Skeleton className="absolute inset-x-0 top-[2px] h-[44px] transition-colors hover:bg-accent rounded-none"></Skeleton>

                    <div className="pointer-events-none absolute inset-x-0 top-1/2 border-b border-dashed border-1"></div>

                    <Skeleton className="absolute inset-x-0 top-[52px] h-[42px] transition-colors rounded-none"></Skeleton>
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}

const VALID_INTERVALS = [5, 10, 15, 20, 30, 60] as const;
const MINIMUM_INTERVAL = 5;
const MAXIMUM_INTERVAL = 60;

function clampToValidInterval(interval: number) {
  const bounded = Math.min(Math.max(interval, MINIMUM_INTERVAL), MAXIMUM_INTERVAL);
  return VALID_INTERVALS.reduce(
    (best, v) => (Math.abs(bounded - v) < Math.abs(bounded - best) ? v : best),
    VALID_INTERVALS[0],
  );
}
