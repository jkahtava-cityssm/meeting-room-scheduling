import { useEffect, useMemo, useState } from "react";
import { formatDate } from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useCalendar } from "@/components/calendar/contexts/calendar-context";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { navigateDate, rangeText } from "@/components/calendar/lib/helpers";
import { uniqBy } from "lodash";
import type { IEvent } from "@/components/calendar/lib/interfaces";
import type { TCalendarView } from "@/components/calendar/lib/types";
import { Skeleton } from "@/components/ui/skeleton";

export function DateNavigator({
  view,
  events,
  selectedDate,
  isLoading,
}: {
  view: TCalendarView;
  events: IEvent[];
  selectedDate: Date;
  isLoading: boolean;
}) {
  const { setSelectedDate } = useCalendar();
  const [eventTotal, setEventTotal] = useState<number>(0);

  useEffect(() => {
    setEventTotal(uniqBy(events, "eventId").length);
  }, [isLoading]);

  const handlePrevious = () => setSelectedDate(navigateDate(selectedDate, view, "previous"));
  const handleNext = () => setSelectedDate(navigateDate(selectedDate, view, "next"));

  return (
    <div className="space-y-0.5">
      <div className="flex items-center gap-2">
        <span className="text-lg font-semibold">
          {formatDate(selectedDate, "MMMM")} {selectedDate.getFullYear()}
        </span>

        <Badge variant="outline" className={`px-1.5 ${isLoading ? "h-5.5" : ""}`}>
          {isLoading ? <Skeleton className="w-14 h-2"></Skeleton> : eventTotal + " events"}
        </Badge>
      </div>

      <div className="flex items-center gap-2">
        <Button variant="outline" className="size-6.5 px-0 [&_svg]:size-4.5" onClick={handlePrevious}>
          <ChevronLeft />
        </Button>

        <p className="text-sm text-muted-foreground">{rangeText(view, selectedDate)}</p>

        <Button variant="outline" className="size-6.5 px-0 [&_svg]:size-4.5" onClick={handleNext}>
          <ChevronRight />
        </Button>
      </div>
    </div>
  );
}
