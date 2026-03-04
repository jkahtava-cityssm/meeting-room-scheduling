"use client";

import { useVirtualizer } from "@tanstack/react-virtual";
import React, { useState, useMemo, useDeferredValue, useEffect, useRef } from "react";
import { icons } from "lucide-react";
import dynamicIconImports from "lucide-react/dynamicIconImports";
import type { LucideIcon, LucideProps } from "lucide-react";

import { Check, ChevronDownIcon, CircleX, Loader2Icon } from "lucide-react";
import { cn } from "@/lib/utils";

import { TColors } from "@/lib/types";
import { sharedIconColorVariants } from "@/lib/theme/colorVariants";
import { cva } from "class-variance-authority";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import DynamicIcon from "@/components/ui/icon-dynamic";
import { useDebounce } from "@/hooks/use-debounce";

type RoomIconComboBoxProps = {
  selectedValue: string | undefined;
  onSelect: (id: string, label: string) => void;
  color?: TColors;
  isDisabled?: boolean;
  dataInvalid?: boolean;
  className?: string;
  placeholderText?: string;
};

type IconName = keyof typeof icons;
type IconValue = keyof typeof dynamicIconImports;

type IconItem = {
  id: IconValue;
  name: IconName;
  Component: LucideIcon;
};

function pascalToKebab(name: string) {
  return (
    name
      .replace(/([a-z0-9])([A-Z])/g, "$1-$2")
      // 2) acronym -> Capital+lower (HTMLParser -> HTML-Parser)
      .replace(/([A-Z]+)([A-Z][a-z])/g, "$1-$2")
      // 3) letter -> numeric chunk (optionally 'x' groups) as a single token
      //    e.g., Grid2x2 -> Grid-2x2, ArrowDown01 -> ArrowDown-01
      .replace(/([A-Za-z])(\d+(?:x\d+)*)/g, "$1-$2")
      // 4) digit -> Uppercase letter (start of new word)
      //    e.g., 2Plus -> 2-Plus (but won't touch 3d or 2x2 because 'd'/'x' are lowercase)
      .replace(/(\d)([A-Z])/g, "$1-$2")

      .toLowerCase()
  );
}

function useIconData() {
  return useMemo(() => {
    const dynamicSet = new Set(Object.keys(dynamicIconImports) as IconValue[]);
    const failures: string[] = [];

    const items: IconItem[] = (Object.keys(icons) as IconName[])
      .map((pascal) => {
        const kebab = pascalToKebab(pascal);
        if (!dynamicSet.has(kebab as IconValue)) {
          failures.push(`${pascal} → ${kebab}`);
          return null;
        }
        return {
          id: kebab as IconValue,
          name: pascal,
          Component: icons[pascal],
        };
      })
      .filter(Boolean) as IconItem[];

    if (process.env.NODE_ENV !== "production" && failures.length) {
      console.warn(`Unmatched Lucide icons (${failures.length})`, failures);
    }
    const byId = new Map<string, IconItem>(items.map((it) => [it.id, it]));
    items.sort((a, b) => a.id.localeCompare(b.id));

    return { items, byId };
  }, []);
}

function chunkArray<T>(array: T[], size: number): T[][] {
  return Array.from({ length: Math.ceil(array.length / size) }, (_, i) => array.slice(i * size, i * size + size));
}

//Might want to look at precomputed JSON for the list of icon names

export function RoomIconComboBox({
  selectedValue,
  onSelect,
  isDisabled = false,
  dataInvalid = false,
  className,
  placeholderText = "Select Icon",
}: RoomIconComboBoxProps) {
  const [open, setOpen] = useState(false);

  const [query, setQuery] = useState("");

  const { items: allIcons, byId } = useIconData();
  const selectedRecord = selectedValue ? byId.get(selectedValue) : undefined;

  const { debouncedValue, isPending } = useDebounce(query, 500);

  const parentRef = useRef(null);

  const filtered = useMemo(() => {
    const q = debouncedValue.trim().toLowerCase();
    if (!q) return allIcons;

    return allIcons.filter((it) => it.name.toLowerCase().includes(q));
  }, [allIcons, debouncedValue]);

  const rows = useMemo(() => chunkArray(filtered, 3), [filtered]);

  const rowVirtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 76, // Height of one row (p-2 + size-8 icon + text)
    overscan: 5, // Pre-render rows outside of view for smoother scrolling
  });

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
            {selectedRecord && <DynamicIcon name={selectedRecord.id} className={cn("h-4 w-4 shrink-0")} />}
            <span className="truncate">{selectedRecord?.name || placeholderText}</span>
          </div>
          <ChevronDownIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-[300px] p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput placeholder="Search icons..." className="h-9" value={query} onValueChange={setQuery} />
          <CommandList ref={parentRef} className="max-h-[350px]">
            <CommandEmpty>No icon found.</CommandEmpty>
            <CommandGroup>
              <div className="grid grid-cols-3 gap-0.5 p-1">
                {filtered?.map((icon) => {
                  return (
                    <IconItem key={icon.id} icon={icon} isSelected={selectedValue === icon.id} onSelect={onSelect} />
                  );
                })}
              </div>
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

const IconItem = React.memo(
  ({
    icon,
    isSelected,
    onSelect,
  }: {
    icon: IconItem;
    isSelected: boolean;
    onSelect: (id: string, label: string) => void;
  }) => {
    const { Component } = icon;

    return (
      <CommandItem
        key={icon.id}
        value={icon.name}
        onSelect={() => onSelect(icon.id, icon.name)}
        className={cn(
          "flex flex-col items-center justify-center gap-1.5 p-2 rounded-md cursor-pointer",
          "hover:bg-accent hover:text-accent-foreground",
          isSelected && "bg-accent text-accent-foreground ring-1 ring-ring",
          "",
        )}
      >
        <Component className={cn("size-8", isSelected && "text-muted-foreground")} />
        <span className="text-[10px] w-full truncate text-center leading-none">{icon.name}</span>
      </CommandItem>
    );
  },
);

IconItem.displayName = "IconItem";
