import { addYears, format } from "date-fns";

import { useDisclosure } from "@/hooks/use-disclosure";

import { Button } from "@/components/ui/button";
import { SingleCalendar } from "@/components/ui/single-calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

import { cn } from "@/lib/utils";

import type { ButtonHTMLAttributes } from "react";
import React, { useState } from "react";

// ================================== //

type TProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, "onSelect" | "value"> & {
  onSelect: (value: Date | undefined) => void;
  value: Date;
  placeholder: string;
  labelVariant?: "P" | "PP" | "PPP";
};

function SingleDayPicker({ id, onSelect, className, placeholder, labelVariant = "PPP", value, ...props }: TProps) {
  const { isOpen, onClose, onToggle } = useDisclosure();
  const [calendarDate, setCalendarDate] = useState(value);

  const handleSelect = (date: Date | undefined) => {
    onSelect(date);
    onClose();
  };

  const handleToday = () => {
    onSelect(new Date());
    onClose();
  };

  return (
    <Popover open={isOpen} onOpenChange={onToggle} modal>
      <PopoverTrigger asChild>
        <Button
          id={id}
          variant="outline"
          className={cn(
            "group relative h-9 w-full justify-start whitespace-nowrap px-3 py-2 font-normal hover:bg-inherit",
            className
          )}
          {...props}
        >
          {value && <span>{format(value, labelVariant)}</span>}
          {!value && <span className="text-muted-foreground">{placeholder}</span>}
        </Button>
      </PopoverTrigger>

      <PopoverContent align="center" className="w-fit p-0">
        <SingleCalendar
          mode="single"
          selected={value}
          onSelect={handleSelect}
          month={calendarDate}
          onMonthChange={setCalendarDate}
          required
          onToday={handleToday}
          view={"day"}
          startMonth={addYears(value, -25)}
          endMonth={addYears(value, 25)}
          fixedWeeks={true}
        />
      </PopoverContent>
    </Popover>
  );
}

// ================================== //

export { SingleDayPicker };
