"use client";

import React, { useState, useMemo } from "react";
import * as Icons from "lucide-react";
import { LucideProps } from "lucide-react";

import { Check, ChevronDownIcon, CircleX, Loader2Icon } from "lucide-react";
import { cn } from "@/lib/utils";

import { TColors } from "@/lib/types";
import { sharedIconColorVariants } from "@/lib/theme/colorVariants";
import { cva } from "class-variance-authority";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem } from "cmdk";

// 1. Icon Color Logic (Matching your existing theme system)
const IconColors = cva("", {
  variants: {
    color: sharedIconColorVariants,
  },
  defaultVariants: {
    color: "invisible",
  },
});

// 2. Filter the icons once outside the component to avoid re-calculating
const ALL_ICONS = Object.keys(Icons)
  .filter((key) => /^[A-Z]/.test(key) && key !== "createLucideIcon")
  .map((name) => ({ id: name, name }));

type RoomIconComboBoxProps = {
  selectedValue: string | undefined;
  onSelect: (id: string, label: string) => void;
  color?: TColors;
  isDisabled?: boolean;
  dataInvalid?: boolean;
  className?: string;
  placeholderText?: string;
};

export function RoomIconComboBox({
  selectedValue,
  onSelect,
  color = "invisible",
  isDisabled = false,
  dataInvalid = false,
  className,
  placeholderText = "Select Icon",
}: RoomIconComboBoxProps) {
  const [open, setOpen] = useState(false);

  // Find selected icon component
  const SelectedIcon = selectedValue ? (Icons[selectedValue as keyof typeof Icons] as React.FC<LucideProps>) : null;
  const iconColorClass = IconColors({ color });

  return (
    <Popover open={open} onOpenChange={setOpen} modal={true}>
      <PopoverTrigger asChild>
        <Button
          variant="combobox"
          role="combobox"
          disabled={isDisabled}
          data-invalid={dataInvalid}
          className={cn(
            "min-w-[240px] justify-between text-sm font-normal",
            !selectedValue && "text-muted-foreground",
            className,
          )}
        >
          <div className="flex items-center gap-2 truncate">
            {SelectedIcon && <SelectedIcon className={cn("h-4 w-4 shrink-0", iconColorClass)} />}
            <span className="truncate">{selectedValue || placeholderText}</span>
          </div>
          <ChevronDownIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-[300px] p-0" align="start">
        <Icons.Command>
          <CommandInput placeholder="Search 1,400+ icons..." className="h-9" />
          <CommandList className="max-h-[350px]">
            <CommandEmpty>No icon found.</CommandEmpty>
            <CommandGroup>
              {/* Note: We render icons directly here. 
                  React.createElement is used because we are mapping strings to components.
              */}
              <div className="grid grid-cols-4 gap-0.5 p-1">
                {ALL_ICONS.map((icon) => {
                  const IconComponent = Icons[icon.id as keyof typeof Icons] as React.FC<LucideProps>;
                  const isSelected = selectedValue === icon.id;

                  return (
                    <CommandItem
                      key={icon.id}
                      value={icon.name}
                      onSelect={() => {
                        onSelect(icon.id, icon.name);
                        setOpen(false);
                      }}
                      className={cn(
                        "flex flex-col items-center justify-center gap-1.5 p-2 rounded-md cursor-pointer",
                        "hover:bg-accent hover:text-accent-foreground",
                        isSelected && "bg-accent text-accent-foreground ring-1 ring-ring",
                      )}
                    >
                      <IconComponent className={cn("h-5 w-5", isSelected ? iconColorClass : "text-muted-foreground")} />
                      <span className="text-[10px] w-full truncate text-center leading-none">{icon.name}</span>
                    </CommandItem>
                  );
                })}
              </div>
            </CommandGroup>
          </CommandList>
        </Icons.Command>
      </PopoverContent>
    </Popover>
  );
}
