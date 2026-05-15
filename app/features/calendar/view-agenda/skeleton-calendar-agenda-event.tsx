import { Printer } from 'lucide-react';

import { Skeleton } from '@/components/ui/skeleton';

import { Label } from '@/components/ui/label';
import { format } from 'date-fns';

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
