"use client";

import * as React from "react";
import { DayPicker } from "react-day-picker";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";

import { cn } from "@/lib/utils";

import type { DayPickerSingleProps, PropsSingle, PropsBase } from "react-day-picker";

function SingleCalendar({
  className,
  classNames,
  showOutsideDays = true,
  selected,
  ...props
}: PropsSingle & PropsBase) {
  const [currentMonth, setCurrentMonth] = React.useState<Date | undefined>(
    selected instanceof Date ? selected : undefined
  );

  return (
    <DayPicker
      selected={selected}
      showOutsideDays={showOutsideDays}
      month={currentMonth}
      onMonthChange={setCurrentMonth}
      className={cn("p-3", className)}
      classNames={{
        button_previous: "flex flex-1 justify-start",
        button_next: "flex flex-1 justify-end",
        /*button_previous: cn(
          cn(buttonVariants({ variant: "outline" }), "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100"),
          " absolute left-1"
        ),
        button_next: cn(
          cn(buttonVariants({ variant: "outline" }), "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100  right-1")
        ),*/
        day: cn(
          "relative p-0 text-center text-sm focus-within:relative focus-within:z-20 [&:has([aria-selected])]:bg-accent [&:has([aria-selected].day-outside)]:bg-accent/50 [&:has([aria-selected].day-range-end)]:rounded-r-md",
          "[&:has([aria-selected])]:rounded-md"
        ),
        day_button: cn(buttonVariants({ variant: "ghost" }), "h-8 w-8 p-0 font-normal aria-selected:opacity-100"),
        disabled: "text-muted-foreground opacity-50",
        hidden: "invisible",
        outside: "day-outside text-muted-foreground aria-selected:bg-accent/50 aria-selected:text-muted-foreground",
        range_start: "day-range-start",
        range_middle: "aria-selected:bg-accent aria-selected:text-accent-foreground",
        range_end: "day-range-end",
        selected:
          "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
        today: "bg-accent text-accent-foreground",
        weekday: "text-muted-foreground rounded-md w-8 font-normal text-[0.8rem]",
        weekdays: "flex",
        week: "flex w-full mt-2",
        month_grid: "w-full border-collapse space-y-1",

        month_caption: "flex justify-center pt-1 relative items-center",

        months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
        month: "space-y-4",

        caption_label: "text-sm font-medium",
        nav: "space-x-1 flex items-center",

        ...classNames,
      }}
      components={{
        Chevron: (props) => {
          if (props.orientation === "left") {
            return <ChevronLeft className={cn("h-4 w-4", className)} {...props} />;
          } else {
            return <ChevronRight className={cn("h-4 w-4", className)} {...props} />;
          }
        },
      }}
      {...props}
    />
  );
}
SingleCalendar.displayName = "Calendar";

export { SingleCalendar };
