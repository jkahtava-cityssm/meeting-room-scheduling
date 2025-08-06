"use client";

import { ForwardRefExoticComponent, RefAttributes, useState } from "react";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "./command";
import { Popover, PopoverContent, PopoverTrigger } from "./popover";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { FormControl } from "./form";
import { Button } from "./button";
import { Slot, SlotProps } from "@radix-ui/react-slot";
import * as PopoverPrimitive from "@radix-ui/react-popover";

interface list {
  key: string;
  label: string;
  value: string;
}

export function ComboBox({
  value,
  defaultValue,
  children,
  list,
  noResultText,
  searchText,
  onSelect,
}: {
  value: string;
  defaultValue: string;
  children: React.ReactNode;
  list: list[];
  noResultText: string;
  searchText: string;
  onSelect: (value: string) => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>{children}</PopoverTrigger>
      <PopoverContent className="w-[200px] p-0">
        <Command>
          <CommandInput placeholder={searchText} className="h-9" />
          <CommandList>
            <CommandEmpty>{noResultText}</CommandEmpty>
            <CommandGroup>
              {list?.map((item) => (
                <CommandItem value={item.value} key={item.key} onSelect={onSelect}>
                  {item.label}
                  <Check className={cn("ml-auto", value === item.value ? "opacity-100" : "opacity-0")} />
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

export function ComboBoxTrigger({
  value,
  list,
  placeholderText,
  className,
  ...props
}: {
  value: string;
  list: list[];
  placeholderText: string;
  className?: string;
  props?: React.ComponentProps<typeof Slot>;
}) {
  return (
    <Button
      variant="outline"
      role="combobox"
      className={cn(
        "w-[200px] justify-between data-[placeholder]:text-muted-foreground text-sm font-normal",
        className
      )}
      data-placeholder={value && value !== "" ? null : ""}
      {...props}
    >
      {value ? list?.find((item) => item.value === value)?.label : placeholderText}
      <ChevronsUpDown className="opacity-50" />
    </Button>
  );
}
