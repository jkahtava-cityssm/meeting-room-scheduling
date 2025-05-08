import { startOfWeek, addDays, format } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";

export function SkeletonCalendarEventListRightPanel() {
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(startOfWeek(new Date()), i));

  return (
    <div className="hidden w-74 divide-y border-l md:block">
      <div className="flex flex-col">
        <div className="flex flex-1 gap-1 pt-2 pl-3 pr-3 items-center">
          <Skeleton className="size-7" />
          <Skeleton className="w-28 h-9 " />
          <Skeleton className="w-20 h-9" />
          <Skeleton className="size-7" />
        </div>

        <div className="flex-1 space-y-2  border-t-0 p-3">
          <div className="grid grid-cols-7 text-center">
            {weekDays.map((day, index) => (
              <div key={index} className="w-8 text-sm font-normal text-muted-foreground">
                {format(day, "EEEEEE")}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-0 ">
            {[...Array(42).keys()].map((index) => {
              return <Skeleton key={index} className="flex flex-1 size-7 p-0 m-1 rounded-md " />;
            })}
          </div>
        </div>
        <div className="bg-accent rounded-bl-sm rounded-br-sm  pl-3 pr-3">
          <Skeleton className="inline-flex items-center justify-center whitespace-nowrap text-sm font-medium   shrink-0  outline-none  border bg-background shadow-xs dark:bg-input/30 dark:border-input  h-8 rounded-md gap-1.5 px-3  m-1">
            Today
          </Skeleton>
        </div>
      </div>

      <div className="flex-1 space-y-2">
        <div className="flex items-start gap-1 px-4 pt-4">
          <Skeleton className="w-full h-4"></Skeleton>
        </div>
        <div className="flex items-start gap-1 px-4 ">
          <Skeleton className="w-full h-4"></Skeleton>
        </div>
        <div className="flex items-start gap-1 px-4 ">
          <Skeleton className="w-full h-4"></Skeleton>
        </div>
      </div>
    </div>
  );
}
