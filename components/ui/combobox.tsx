"use client";

import { useState } from "react";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "./command";
import { Popover, PopoverContent, PopoverTrigger } from "./popover";
import { Check, ChevronDownIcon } from "lucide-react";
import { cn } from "@/lib/utils";

import { Button } from "./button";
import { Slot } from "@radix-ui/react-slot";

interface list {
  key: string;
  label: string;
  value: string;
}

export function ComboBox({
  value,
  children,
  list,
  noResultText,
  searchText,
  onSelect,
}: {
  value: string;
  children: React.ReactNode;
  list: list[];
  noResultText: string;
  searchText: string;
  onSelect: (value: string) => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen} modal={true}>
      <PopoverTrigger asChild>{children}</PopoverTrigger>
      <PopoverContent className="w-[300px] p-0">
        <Command>
          <CommandInput placeholder={searchText} className="h-9" />
          <CommandList>
            <CommandEmpty>{noResultText}</CommandEmpty>
            <CommandGroup>
              {list?.map((item) => (
                <CommandItem
                  value={item.label}
                  key={item.key}
                  onSelect={() => {
                    onSelect(item.value);
                    setOpen(false);
                  }}
                >
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
  disabled,
  ...props
}: {
  value: string;
  list: list[];
  placeholderText: string;
  className?: string;
  disabled?: boolean;
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
      disabled={disabled}
      data-placeholder={value && value !== "" ? null : true}
      {...props}
    >
      {value ? list?.find((item) => item.value === value)?.label : placeholderText}
      <ChevronDownIcon className="opacity-50" />
    </Button>
  );
}
