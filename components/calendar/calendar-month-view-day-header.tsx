import { cn } from "@/lib/utils";
import { navigateURL } from "@/lib/helpers";

import { Button } from "../ui/button";

import { IDayView } from "./calendar-month-view";
import { useRouter } from "next/navigation";

export function MonthViewDayHeader({ dayRecord }: { dayRecord: IDayView }) {
  const { push } = useRouter();

  const handleClick = () => {
    push(navigateURL(dayRecord.dayDate, "day"));
  };

  return (
    <div className={cn("flex h-full flex-col gap-1 border-l py-1 overflow-hidden", dayRecord.isSunday && "border-l-0")}>
      <Button
        variant={"ghost"}
        className={cn(
          "flex w-8 translate-x-1 items-center justify-center h-4 px-1 text-xs font-semibold lg:px-2",
          !dayRecord.isCurrentMonth && "opacity-20 hover:bg-primary/20",
          dayRecord.isToday && "rounded-full bg-primary px-0 font-bold text-primary-foreground"
        )}
        onClick={handleClick}
      >
        {dayRecord.day}
      </Button>
    </div>
  );
}
