import { useEffect, useMemo, useState } from "react";
import { formatDate } from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { useCalendar } from "@/calendar/contexts/calendar-context";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

import { getEventsCount, navigateDate, rangeText } from "@/calendar/helpers";

import type { IEvent } from "@/calendar/interfaces";
import type { TCalendarView } from "@/calendar/types";
import { getEventsDaily, getEventsMonthly, getEventsWeekly, getEventsYearly } from "@/services/events";
import { Skeleton } from "@/components/ui/skeleton";

interface IProps {
  view: TCalendarView;
}

export function DateNavigator({ view }: IProps) {
  const { selectedDate, setSelectedDate, selectedRoomId } = useCalendar();

  const [eventTotal, setEventTotal] = useState<number>(0);

  const [isLoading, setLoading] = useState(true);

  const fetchEvents = async () => {
    setLoading(true);

    let eventList = [];
    switch (view) {
      case "day":
      case "agenda":
        const dailyEvents = await getEventsDaily(selectedDate);
        setEventTotal(dailyEvents.data.length);
        break;
      case "week":
        const weeklyEvents = await getEventsWeekly(selectedDate);
        setEventTotal(weeklyEvents.data.length);
        break;
      case "month":
        const monthlyEvents = await getEventsMonthly(selectedDate);
        setEventTotal(monthlyEvents.data.length);
        break;
      case "year":
        const yearlyEvents = await getEventsYearly(selectedDate);
        setEventTotal(yearlyEvents.data.length);
        break;

      default:
        setEventTotal(0);
        break;
    }

    setLoading(false);
  };

  useEffect(() => {
    fetchEvents();
  }, [selectedDate]);

  const month = formatDate(selectedDate, "MMMM");
  const year = selectedDate.getFullYear();

  //const eventCount = useMemo(() => getEventsCount(events, selectedDate, view), [events, selectedDate, view]);

  const handlePrevious = () => setSelectedDate(navigateDate(selectedDate, view, "previous"));
  const handleNext = () => setSelectedDate(navigateDate(selectedDate, view, "next"));

  return (
    <div className="space-y-0.5">
      <div className="flex items-center gap-2">
        <span className="text-lg font-semibold">
          {month} {year}
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
