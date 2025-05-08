import { MapPin, Clock, Text } from "lucide-react";

import { Skeleton } from "@/components/ui/skeleton";

import { Label } from "@/components/ui/label";
import { format } from "date-fns";
import { SkeletonCalendarEventListRightPanel } from "./skeleton-calendar-day-right-panel";

export function AgendaEventSkeleton({ selectedDate }: { selectedDate: Date }) {
  return (
    <div className="flex">
      <div className="flex flex-1 flex-col space-y-2">
        <div className="sticky top-14 flex items-center gap-4 bg-accent p-2">
          <Label className="text-md font-semibold">{format(selectedDate, "EEEE, MMMM d, yyyy")}</Label>
        </div>
        <AgendaEventBlockSkeleton></AgendaEventBlockSkeleton>
        <AgendaEventBlockSkeleton></AgendaEventBlockSkeleton>
      </div>
      <SkeletonCalendarEventListRightPanel />
    </div>
  );
}

function AgendaEventBlockSkeleton() {
  return (
    <div className="space-y-2 m-2">
      <div className="flex select-none items-center justify-between gap-3 rounded-md border p-3 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring">
        <div className="flex flex-1 flex-col gap-2">
          <div className="flex items-center gap-1.5  w-full">
            <Skeleton className="h-6 w-full"></Skeleton>
          </div>

          <div className="mt-1 flex items-center gap-1">
            <MapPin className="size-5 shrink-0" />
            <Skeleton className="h-5 w-full"></Skeleton>
          </div>

          <div className="flex items-center gap-1">
            <Clock className="size-5 shrink-0" />
            <Skeleton className="h-5 w-full"></Skeleton>
          </div>

          <div>
            <div className="flex items-center gap-2 mb-2">
              <Text className="size-5 shrink-0" />
              <div>
                <p className="text-sm font-medium">Description</p>
              </div>
            </div>
            <div className="flex items-center gap-2 pl-7">
              <Skeleton className="h-40 w-full"></Skeleton>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
