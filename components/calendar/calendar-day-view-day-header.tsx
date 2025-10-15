import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { IDayView } from "./calendar-week-view";
import { navigateURL } from "@/lib/helpers";

export function DayViewDayHeader({ dayView }: { dayView: IDayView }) {
  const { push } = useRouter();

  const handleClick = () => {
    if (dayView) push(navigateURL(dayView.dayDate, "day"));
  };

  return (
    <Button variant={"link"} size={"sm"} onClick={handleClick}>
      <Link href="day-view">
        <span className="py-2 text-center text-xs font-medium text-muted-foreground">
          {format(dayView.dayDate, "EE")}{" "}
          <span className="ml-1 font-semibold text-foreground">{format(dayView.dayDate, "d")}</span>
        </span>
      </Link>
    </Button>
  );
}
