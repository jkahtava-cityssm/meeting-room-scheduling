import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { navigateURL } from "@/lib/helpers";

export function WeekViewDayHeader({ currentDate }: { currentDate: Date }) {
  const { push } = useRouter();

  const handleClick = () => {
    push(navigateURL(currentDate, "day"));
  };

  return true ? (
    <Button variant={"link"} size={"sm"} onClick={handleClick}>
      <Link href="day-view">
        <span className="py-2 text-center text-xs font-medium text-muted-foreground">
          {format(currentDate, "EE")}{" "}
          <span className="ml-1 font-semibold text-foreground">{format(currentDate, "d")}</span>
        </span>
      </Link>
    </Button>
  ) : (
    <span className="py-2 text-center text-xs font-medium text-muted-foreground">
      {format(currentDate, "EE")} <span className="ml-1 font-semibold text-foreground">{format(currentDate, "d")}</span>
    </span>
  );
}
