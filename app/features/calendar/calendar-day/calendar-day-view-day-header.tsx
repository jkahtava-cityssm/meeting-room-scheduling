import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { IDayView } from "../../../../components/calendar/calendar-week-view";
import { navigateURL } from "@/lib/helpers";

export function DayViewDayHeader({ currentDate }: { currentDate: Date }) {
  const { push } = useRouter();

  const handleClick = () => {
    if (currentDate) push(navigateURL(currentDate, "day"));
  };

  return (
    <div className="h-8 shrink-0">
      <Button variant={"link"} size={"sm"} onClick={handleClick} className=" w-full">
        <span className="py-2 text-center text-xs font-medium text-muted-foreground">
          {format(currentDate, "EE")}{" "}
          <span className="ml-1 font-semibold text-foreground">{format(currentDate, "d")}</span>
        </span>
      </Button>
    </div>
  );
}
