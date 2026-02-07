import { formatDate } from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useCalendar } from "@/contexts/CalendarProviderPrivate";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { rangeText } from "@/lib/helpers";

import type { TCalendarView } from "@/lib/types";
import { Skeleton } from "@/components/ui/skeleton";

export function DateNavigator({
  view,
  selectedDate,
  onPreviousClick,
  onNextClick,
}: {
  view: TCalendarView;
  selectedDate: Date;
  onPreviousClick: () => void;
  onNextClick: () => void;
}) {
  const { isHeaderLoading, totalEvents } = useCalendar();

  return (
    <div className="space-y-0.5">
      <div className="flex items-center gap-2">
        <span className="text-lg font-semibold w-35">
          {formatDate(selectedDate, "MMMM")} {selectedDate.getFullYear()}
        </span>

        <Badge variant="outline" className={`px-1.5 ${isHeaderLoading ? "h-5.5" : ""}`}>
          {isHeaderLoading ? <Skeleton className="w-14 h-2"></Skeleton> : totalEvents + " events"}
        </Badge>
      </div>

      <div className="flex items-center  gap-2">
        <Button variant="outline" className="size-6.5 px-0 [&_svg]:size-4.5" onClick={onPreviousClick}>
          <ChevronLeft />
        </Button>
        {view === "day" || view === "agenda" ? (
          <p className="text-sm text-muted-foreground text-center w-25">{rangeText(view, selectedDate)}</p>
        ) : (
          <p className="text-sm text-muted-foreground text-center w-45">{rangeText(view, selectedDate)}</p>
        )}
        <Button variant="outline" className="size-6.5 px-0 [&_svg]:size-4.5" onClick={onNextClick}>
          <ChevronRight />
        </Button>
      </div>
    </div>
  );
}
