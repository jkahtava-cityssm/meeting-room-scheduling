import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { IDayView } from "./calendar-week-view";
import { navigateURL } from "@/lib/helpers";

export function DayViewDayHeader({ dayView }: { dayView: IDayView | undefined }) {
  const { push } = useRouter();

  const handleClick = () => {
    if (dayView) push(navigateURL(dayView.dayDate, "day"));
  };

  return dayView ? (
    <Button variant={"link"} size={"sm"} onClick={handleClick}>
      <Link href="day-view">
        <span className="py-2 text-center text-xs font-medium text-muted-foreground">
          {format(dayView.dayDate, "EE")}{" "}
          <span className="ml-1 font-semibold text-foreground">{format(dayView.dayDate, "d")}</span>
        </span>
      </Link>
    </Button>
  ) : (
    <Button variant={"link"} size={"sm"}>
      <span className="py-2 text-center text-xs font-medium text-muted-foreground">
        ERROR <span className="ml-1 font-semibold text-foreground">{format(dayView.dayDate, "d")}</span>
      </span>
    </Button>
  );
  /*
  return (
    <div className="relative z-20 flex border-b">
      <div className="w-18"></div>
      <div className={`grid flex-1 grid-cols-${weekDays.length} divide-x border-l`}>
        {weekDays.map((day, index) =>
          weekDays.length > 1 ? (
            <Button key={index} variant={"link"} size={"sm"} onClick={() => handleClick()}>
              <Link href="day-view">
                <span key={index} className="py-2 text-center text-xs font-medium text-muted-foreground">
                  {format(day, "EE")} <span className="ml-1 font-semibold text-foreground">{format(day, "d")}</span>
                </span>
              </Link>
            </Button>
          ) : (
            <span key={index} className="py-2 text-center text-xs font-medium text-muted-foreground">
              {format(day, "EE")} <span className="ml-1 font-semibold text-foreground">{format(day, "d")}</span>
            </span>
          )
        )}
      </div>
    </div>
  );
  */
}
