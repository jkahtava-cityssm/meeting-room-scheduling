import { useEffect, useMemo, useState } from "react";
import { formatDate } from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useCalendar } from "@/contexts/CalendarProvider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { navigateURL, rangeText } from "@/lib/helpers";
import { uniqBy } from "lodash";

import type { TCalendarView } from "@/lib/types";
import { Skeleton } from "@/components/ui/skeleton";
import { IEvent } from "@/lib/schemas/schemas";

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
        <span className="text-lg font-semibold">
          {formatDate(selectedDate, "MMMM")} {selectedDate.getFullYear()}
        </span>

        <Badge variant="outline" className={`px-1.5 ${isHeaderLoading ? "h-5.5" : ""}`}>
          {isHeaderLoading ? <Skeleton className="w-14 h-2"></Skeleton> : totalEvents + " events"}
        </Badge>
      </div>

      <div className="flex items-center gap-2">
        <Button variant="outline" className="size-6.5 px-0 [&_svg]:size-4.5" onClick={onPreviousClick}>
          <ChevronLeft />
        </Button>

        <p className="text-sm text-muted-foreground">{rangeText(view, selectedDate)}</p>

        <Button variant="outline" className="size-6.5 px-0 [&_svg]:size-4.5" onClick={onNextClick}>
          <ChevronRight />
        </Button>
      </div>
    </div>
  );
}
