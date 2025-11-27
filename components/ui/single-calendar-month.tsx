import { useRouter } from "next/navigation";

import React, { useMemo } from "react";

import { navigateURL } from "@/lib/helpers";

import { addMonths, addYears, format, isSameMonth, parse, startOfMonth, startOfYear } from "date-fns";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";

export default function SingleCalendarMonth({ selectedDate }: { selectedDate: Date }) {
  const [currentDate, setCurrentDate] = React.useState<Date>(selectedDate);

  const { push } = useRouter();

  const handleClick = () => {
    push(navigateURL(selectedDate, "month"));
  };

  const handleNavigate = (date: Date) => {
    push(navigateURL(date, "month"));
  };

  const monthList = useMemo(() => {
    const yearStart = startOfYear(currentDate);
    return Array.from({ length: 12 }, (_, i) => addMonths(yearStart, i));
  }, [currentDate]);

  return (
    <div className="flex flex-col">
      <div className="flex items-center w-full justify-between mt-1">
        <Button
          variant={"outline"}
          className="h-7 w-7 bg-transparent p-1 m-2 ml-auto hover:opacity-100 [&_svg]:fill-foreground  shadow-xs"
          onClick={() => {
            setCurrentDate(addYears(currentDate, -1));
          }}
        >
          <ChevronLeft className={"h-4 w-4"}></ChevronLeft>
        </Button>
        <div className="flex items-center gap-1 2 ">
          <YearSelection selectedDate={currentDate} onYearChange={(date) => setCurrentDate(date)}></YearSelection>
        </div>
        <Button
          variant={"outline"}
          className="h-7 w-7 bg-transparent p-1 m-2 mr-auto  hover:opacity-100 [&_svg]:fill-foreground  shadow-xs"
          onClick={() => {
            setCurrentDate(addYears(currentDate, 1));
          }}
        >
          <ChevronRight className={"h-4 w-4"}></ChevronRight>
        </Button>
      </div>

      <div className="flex-1 mx-8 pb-1 min-h-65">
        <div className="flex justify-center w-full mt-2">
          <div className="text-xs font-medium text-muted-foreground h-4"></div>
        </div>

        <div className="grid grid-cols-4 gap-x-0.5 gap-y-2">
          {monthList.map((date, index) => {
            const month = format(date, "MMM");
            const isMonth = isSameMonth(date, selectedDate);
            return (
              <Button
                variant={"ghost"}
                key={index}
                onClick={() => handleNavigate(date)}
                type="button"
                className={` size-14 p-2 ${isMonth && "bg-primary font-semibold text-primary-foreground"}`}
              >
                <div className="flex flex-col justify-center align-middle">
                  <div className={`flex size-6 items-center justify-center rounded-full text-xs font-medium`}>
                    {month}
                  </div>
                </div>
              </Button>
            );
          })}
        </div>
      </div>
      <div className="bg-accent rounded-bl-sm rounded-br-sm  pl-3 pr-3">
        <Button
          variant={"outline"}
          size={"sm"}
          className="m-1"
          onClick={() => handleNavigate(startOfMonth(new Date()))}
        >
          Today
        </Button>
      </div>
    </div>
  );
}

function YearSelection({ selectedDate, onYearChange }: { selectedDate: Date; onYearChange?: (date: Date) => void }) {
  const years = useMemo(() => {
    const yearStart = startOfYear(selectedDate);
    const nextYearList = Array.from({ length: 25 }, (_, i) => addYears(yearStart, i + 1));
    const previousYearList = Array.from({ length: 26 }, (_, i) => addYears(yearStart, i * -1));

    return [...previousYearList.reverse(), ...nextYearList];
  }, [selectedDate]);

  return (
    <Select
      value={format(selectedDate, "yyyy")}
      onValueChange={(value) => {
        const parsed = parse(value, "yyyy", new Date());

        onYearChange?.(parsed);
      }}
    >
      <SelectTrigger aria-label={`${format(selectedDate, "yyyy")}`} className={`pr-1.5 focus:ring-0 w-48`}>
        <div className="flex justify-center items-center w-full">
          <SelectValue />
        </div>
      </SelectTrigger>
      <SelectContent position="popper">
        <ScrollArea className="h-40">
          {years?.map((year, id: number) => {
            return (
              <SelectItem
                key={`${format(year, "yyyy")}-${id}`}
                value={format(year, "yyyy")}
                className="flex justify-center items-center w-full"
              >
                {format(year, "yyyy")}
              </SelectItem>
            );
          })}
          <ScrollBar forceMount orientation="vertical"></ScrollBar>
        </ScrollArea>
      </SelectContent>
    </Select>
  );
}
