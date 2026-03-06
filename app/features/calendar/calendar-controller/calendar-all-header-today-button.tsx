import { formatDate } from "date-fns";

import Link from "next/link";
import { navigateURL } from "@/lib/helpers";
import { TCalendarView } from "@/lib/types";

export function TodayButton({ view }: { view: TCalendarView }) {
  const today = new Date();

  return (
    <Link
      className="flex size-14 flex-col items-start overflow-hidden rounded-lg border focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
      href={navigateURL(today, view)}
    >
      <p className="flex h-6 w-full items-center justify-center bg-primary text-center text-xs font-semibold text-primary-foreground">
        {formatDate(today, "MMM").toUpperCase()}
      </p>
      <p className="flex w-full items-center justify-center text-lg font-bold">{today.getDate()}</p>
    </Link>
  );
}
