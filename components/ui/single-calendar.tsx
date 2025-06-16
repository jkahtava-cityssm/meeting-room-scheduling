"use client";

import * as React from "react";
import { DayPicker, getDefaultClassNames } from "react-day-picker";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { Button, buttonVariants } from "@/components/ui/button";

import { cn } from "@/lib/utils";

import type { PropsSingleRequired, PropsBase, DropdownProps } from "react-day-picker";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./select";
import { ScrollArea } from "@radix-ui/react-scroll-area";

import { TCalendarView } from "@/lib/types";

function SingleCalendar({
  className,
  classNames,
  showOutsideDays = true,
  selected,
  onToday,
  ...props
}: PropsSingleRequired & PropsBase & { onToday: () => void; view: TCalendarView }) {
  /*const { push } = useRouter();

  const [currentMonth, setCurrentMonth] = React.useState<Date | undefined>(
    selected instanceof Date ? selected : undefined
  );

  const handleToday = () => {
    setCurrentMonth(new Date());

    push(navigateURL(new Date(), view));
  };*/

  const defaultClassNames = getDefaultClassNames();
  return (
    <div>
      <div className="pt-3 pl-3 pr-3">
        <DayPicker
          captionLayout="dropdown"
          role="application"
          selected={selected}
          onSelect={props.onSelect}
          showOutsideDays={showOutsideDays}
          //month={currentMonth}
          //onMonthChange={setCurrentMonth}
          //fixedWeeks={props.fixedWeeks}
          //footer={selected ? `You have selected ${selected.toLocaleDateString()}.` : "Please pick a date."}
          className={cn("pb-1", className)}
          classNames={{
            dropdowns: cn("flex items-center gap-1", classNames?.dropdowns),

            months: `relative flex ${defaultClassNames.month}`,
            month_caption: `relative mx-10 flex h-7 items-center justify-center ${defaultClassNames.month_caption}`,
            weekdays: cn("flex flex-row", classNames?.weekdays),
            weekday: cn("w-8 text-sm font-normal text-muted-foreground", classNames?.weekday),
            month: cn("w-full", classNames?.month),

            caption_label: cn("truncate text-sm font-medium", classNames?.caption_label),
            button_next: cn(
              buttonVariants({ variant: "outline" }),
              "h-7 w-7 bg-transparent p-0 hover:opacity-100 absolute right-1 [&_svg]:fill-foreground  shadow-xs",
              classNames?.button_next
            ),
            button_previous: cn(
              buttonVariants({ variant: "outline" }),
              "h-7 w-7 bg-transparent p-0 hover:opacity-100 absolute left-1 [&_svg]:fill-foreground",
              classNames?.button_previous
            ),
            nav: cn("flex items-start", classNames?.nav),
            month_grid: cn("mx-auto mt-4", classNames?.month_grid),
            week: cn("mt-2 flex w-max items-start", classNames?.week),
            day: cn(
              "flex size-8 flex-1 items-center justify-center p-0 text-sm [&>button]:hover:bg-primary/50 [&>button]:hover:text-primary-foreground",
              classNames?.day
            ),
            day_button: cn(
              "size-8 rounded-md p-0 font-normal transition-none aria-selected:opacity-100",
              classNames?.day_button
            ),
            range_start: cn(
              "bg-accent [&>button]:bg-primary [&>button]:text-primary-foreground [&>button]:hover:bg-primary [&>button]:hover:text-primary-foreground day-range-start rounded-s-md",
              classNames?.range_start
            ),
            range_middle: cn(
              "bg-accent !text-foreground [&>button]:bg-transparent [&>button]:!text-foreground [&>button]:hover:bg-transparent [&>button]:hover:!text-foreground",
              classNames?.range_middle
            ),
            range_end: cn(
              "bg-accent [&>button]:bg-primary [&>button]:text-primary-foreground [&>button]:hover:bg-primary [&>button]:hover:text-primary-foreground day-range-end rounded-e-md",
              classNames?.range_end
            ),
            selected: cn(
              "[&>button]:bg-primary [&>button]:text-primary-foreground [&>button]:hover:bg-primary [&>button]:hover:text-primary-foreground",
              classNames?.selected
            ),
            today: cn("[&>button]:bg-accent [&>button]:text-accent-foreground", classNames?.today),
            outside: cn(
              "day-outside text-muted-foreground opacity-50 aria-selected:bg-accent/50 aria-selected:text-muted-foreground aria-selected:opacity-30",
              classNames?.outside
            ),
            disabled: cn("text-muted-foreground opacity-50", classNames?.disabled),
            hidden: cn("invisible flex-1", classNames?.hidden),
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
            Dropdown: ({ value, onChange, ...props }: DropdownProps) => {
              const selected = props.options?.find((child) => child.value === value);

              const handleChange = (value: string) => {
                const changeEvent = {
                  target: { value },
                } as React.ChangeEvent<HTMLSelectElement>;
                onChange?.(changeEvent);
              };

              return (
                <Select
                  value={value?.toString()}
                  onValueChange={(value) => {
                    handleChange(value);
                  }}
                >
                  <SelectTrigger
                    aria-label={`${
                      props.className?.includes("years_dropdown") ? value?.toString() : value?.toString()
                    }`}
                    className={`pr-1.5 focus:ring-0 ${props.className?.includes("months_dropdown") ? "w-28" : "w-20"}`}
                  >
                    <SelectValue>{selected?.label}</SelectValue>
                  </SelectTrigger>
                  <SelectContent position="popper">
                    <ScrollArea className="h-40">
                      {props.options?.map((option, id: number) => (
                        <SelectItem key={`${option.value}-${id}`} value={option.value?.toString() ?? ""}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </ScrollArea>
                  </SelectContent>
                </Select>
              );
            },
          }}
          {...props}
        />
      </div>
      <div className="bg-accent rounded-bl-sm rounded-br-sm  pl-3 pr-3">
        <Button variant={"outline"} size={"sm"} className="m-1" onClick={onToday}>
          Today
        </Button>
      </div>
    </div>
  );
}
SingleCalendar.displayName = "Calendar";

export { SingleCalendar };

/*
 dropdowns: cn("flex flex-1 justify-end gap-1", classNames?.dropdowns),

        months: cn("relative flex", defaultClassNames.month),
        //month_caption: cn("relative flex h-7 items-center", defaultClassNames.month_caption),
        month_caption: cn("relative mx-10 flex h-7 items-center justify-center", defaultClassNames.month_caption),
        weekdays: cn("flex flex-row", classNames?.weekdays),
        weekday: cn("w-8 text-sm font-normal text-muted-foreground", classNames?.weekday),
        month: cn("w-full", classNames?.month),

        caption_label: cn("truncate text-sm font-medium", classNames?.caption_label),
        button_next: cn(
          buttonVariants({ variant: "outline" }),
          //"h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100 [&_svg]:fill-foreground absolute left-9",
          "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100 absolute right-1 [&_svg]:fill-foreground",
          classNames?.button_next
        ),
        button_previous: cn(
          buttonVariants({ variant: "outline" }),
          //"h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100 [&_svg]:fill-foreground absolute left-1",
          "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100 absolute left-1 [&_svg]:fill-foreground",
          classNames?.button_previous
        ),
        //nav: cn("flex items-start", classNames?.nav),
*/
