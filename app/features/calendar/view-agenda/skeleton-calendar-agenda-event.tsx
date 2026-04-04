import { MapPin, Clock, Text, Printer } from 'lucide-react';

import { Skeleton } from '@/components/ui/skeleton';

import { Label } from '@/components/ui/label';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
//import { SkeletonCalendarEventListRightPanel } from "./skeleton-calendar-day-right-panel";

export function AgendaEventSkeleton({ selectedDate }: { selectedDate: Date }) {
  return (
    <div className="flex flex-1 flex-col space-y-2">
      <div className="sticky top-0 flex items-center gap-4 bg-accent p-2 m-0">
        <Label className="flex-1 text-md font-semibold">{format(selectedDate, 'EEEE, MMMM d, yyyy')}</Label>

        <Skeleton className="inline-flex items-center justify-center gap-2 w-full  sm:w-auto h-9 px-3 py-2 shrink-0  text-sm font-medium bg-primary text-accent  mr-2 ">
          <Printer size={16} />
          Print Agenda
        </Skeleton>
      </div>
      <div className="m-4 flex-1 flex flex-col">
        <Skeleton className="flex-1 w-full"></Skeleton>
      </div>
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
