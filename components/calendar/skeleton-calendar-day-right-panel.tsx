import { Skeleton } from "@/components/ui/skeleton";
import { DayPicker } from "../ui/day-picker";

export function SkeletonCalendarEventListRightPanel({ date }: { date: Date }) {
  //const weekDays = Array.from({ length: 7 }, (_, i) => addDays(startOfWeek(new Date()), i));

  return (
    <div className="hidden w-74 divide-y border-l md:block">
      <DayPicker
        className="mx-auto w-fit"
        mode="single"
        selected={date}
        onSelect={() => {}}
        month={date}
        onMonthChange={() => {}}
        required
        onToday={() => {}}
      />

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
