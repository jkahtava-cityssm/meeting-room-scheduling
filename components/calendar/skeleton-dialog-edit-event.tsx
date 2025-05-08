import { Skeleton } from "@/components/ui/skeleton";

import { Label } from "@/components/ui/label";

export function EditEventSkeleton() {
  return (
    <div>
      <div className="flex flex-col md:flex-row gap-2">
        <div className="flex flex-col flex-1 gap-4 py-4">
          <div className="grid gap-2">
            <Label className="text-sm font-medium">Room</Label>
            <Skeleton className="h-8"></Skeleton>
          </div>
          <div className="grid gap-2">
            <Label className="text-sm font-medium">Title</Label>
            <Skeleton className="h-8"></Skeleton>
          </div>
          <div className="flex items-start gap-2">
            <div className="grid gap-2 flex-1">
              <Label className="text-sm font-medium">Start Date</Label>
              <Skeleton className="h-8"></Skeleton>
            </div>
            <div className="grid gap-2 flex-1">
              <div className="flex gap-2 justify-items-center">
                <div className="grid gap-2">
                  <Label className="text-sm font-medium">Hours</Label>
                  <Skeleton className="h-8 w-[48px]"></Skeleton>
                </div>
                <div className="grid gap-2  justify-items-center">
                  <Label className="text-sm font-medium">Minutes</Label>
                  <Skeleton className="h-8 w-[48px]"></Skeleton>
                </div>
                <div className="grid gap-2  justify-items-center">
                  <Label className="text-sm font-medium">Period</Label>
                  <Skeleton className="h-8 w-[58px]"></Skeleton>
                </div>
              </div>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <div className="grid gap-2 flex-1">
              <Label className="text-sm font-medium">End Date</Label>
              <Skeleton className="h-8"></Skeleton>
            </div>
            <div className="grid gap-2 flex-1">
              <div className="flex gap-2 justify-items-center">
                <div className="grid gap-2">
                  <Label className="text-sm font-medium">Hours</Label>
                  <Skeleton className="h-8 w-[48px]"></Skeleton>
                </div>
                <div className="grid gap-2  justify-items-center">
                  <Label className="text-sm font-medium">Minutes</Label>
                  <Skeleton className="h-8 w-[48px]"></Skeleton>
                </div>
                <div className="grid gap-2  justify-items-center">
                  <Label className="text-sm font-medium">Period</Label>
                  <Skeleton className="h-8 w-[58px]"></Skeleton>
                </div>
              </div>
            </div>
          </div>
          <div className="grid gap-2">
            <Label className="text-sm font-medium">Duration:</Label>
            <Skeleton className="h-8"></Skeleton>
          </div>
        </div>
        <div className="flex flex-col flex-1 gap-4 py-4">
          <div className="grid gap-2">
            <Label className="text-sm font-medium">Description:</Label>
            <Skeleton className="h-90"></Skeleton>
          </div>
        </div>
      </div>
      <div className="flex gap-2 sm:flex-col-reverse md:flex-row md:justify-end ">
        <Skeleton className="h-9 px-4 py-2 shadow-xs  text-sm font-medium ">Save Changes</Skeleton>
        <Skeleton className="h-9 px-4 py-2 shadow-xs  text-sm font-medium ">Cancel</Skeleton>
      </div>
    </div>
  );
}
