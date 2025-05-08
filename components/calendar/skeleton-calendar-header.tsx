import { Columns, Grid3x3, List, Plus, Grid2x2, CalendarRange } from "lucide-react";

import type { TCalendarView } from "@/components/calendar/lib/types";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

export function CalendarHeaderSkeleton({ view }: { view: TCalendarView }) {
  return (
    <div className="flex flex-col gap-4 border-b p-4 lg:flex-row lg:items-center lg:justify-between">
      <div className="flex items-center gap-3">
        <div className="flex size-14 flex-col rounded-lg border">
          <Skeleton className="flex h-6 w-full bg-primary rounded-b-none "></Skeleton>
          <Skeleton className="flex w-full"></Skeleton>
        </div>
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <Skeleton className="w-22.5 h-6.5"></Skeleton>
            <Skeleton className="w-10 h-6.5"></Skeleton>
            <Badge variant="outline" className="px-1.5 h-5.5">
              <Skeleton className="w-14 h-2"></Skeleton>
            </Badge>
          </div>

          <div className="flex items-center gap-2">
            <Skeleton className="size-6.5 px-0 [&_svg]:size-4.5"></Skeleton>
            <Skeleton className="w-20 h-6.5"></Skeleton>
            <Skeleton className="size-6.5 px-0 [&_svg]:size-4.5"></Skeleton>
          </div>
        </div>
      </div>

      <div className="flex flex-col items-center gap-1.5 sm:flex-row sm:justify-between">
        <div className="flex w-full items-center gap-1.5">
          <div className="inline-flex ">
            <Skeleton
              className={`w-9 h-9 rounded-r-none inline-flex items-center justify-center border-b-primary border-r-1 ${
                view === "day" ? "bg-primary text-primary-foreground shadow-xs" : ""
              }`}
            >
              <List size={16} strokeWidth={1} />
            </Skeleton>
            <Skeleton
              className={`w-9 h-9 rounded-none inline-flex items-center justify-center border-b-primary border-r-1 ${
                view === "week" ? "bg-primary text-primary-foreground shadow-xs" : ""
              }`}
            >
              <Columns size={16} strokeWidth={1} />
            </Skeleton>
            <Skeleton
              className={`w-9 h-9 rounded-none inline-flex items-center justify-center border-b-primary border-r-1 ${
                view === "month" ? "bg-primary text-primary-foreground shadow-xs" : ""
              }`}
            >
              <Grid2x2 size={16} strokeWidth={1} />
            </Skeleton>
            <Skeleton
              className={`w-9 h-9 rounded-none inline-flex items-center justify-center border-b-primary border-r-1 ${
                view === "year" ? "bg-primary text-primary-foreground shadow-xs" : ""
              }`}
            >
              <Grid3x3 size={16} strokeWidth={1} />
            </Skeleton>
            <Skeleton
              className={`w-9 h-9 rounded-l-none inline-flex items-center justify-center border-b-primary border-l-1 ${
                view === "agenda" ? "bg-primary text-primary-foreground shadow-xs" : ""
              }`}
            >
              <CalendarRange size={16} strokeWidth={1} />
            </Skeleton>
          </div>
          <Skeleton className="flex w-fit items-center justify-between gap-2 shrink-0 h-9 flex-1 md:w-60"></Skeleton>
        </div>
        <Skeleton className="inline-flex items-center justify-center gap-2 w-full  sm:w-auto h-9 px-3 py-2 shrink-0  text-sm font-medium">
          <Plus size={16} strokeWidth={1} />
          Add Event
        </Skeleton>
      </div>
    </div>
  );
}
