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
    const iconsById = new Map<string, IconItem>(items.map((it) => [it.id, it]));
    items.sort((a, b) => a.id.localeCompare(b.id));

    return { items, iconsById };
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
  const [wasMeasured, setWasMeasured] = useState(false);

  const { items: allIcons, iconsById } = useIconData();
  const selectedRecord = selectedValue ? iconsById.get(selectedValue) : undefined;

  const { debouncedValue, isPending } = useDebounce(query, 500);

  const filtered = useMemo(() => {
    const value = debouncedValue.trim().toLowerCase();
    if (!value) return allIcons;

    return allIcons.filter((it) => it.name.toLowerCase().includes(value));
  }, [allIcons, debouncedValue]);

  const parentRef = useRef<HTMLDivElement | null>(null);
  const rows = useMemo(() => chunkArray(filtered, 3), [filtered]);

  const rowVirtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 76, // Height of one row (p-2 + size-8 icon + text)
    overscan: 5, // Pre-render rows outside of view for smoother scrolling
    getItemKey: (index) => rows[index]?.[0]?.id ?? index,
  });

  useEffect(() => {
    if (!open) {
      setWasMeasured(false);
      return;
    }
    const id = requestAnimationFrame(() => {
      rowVirtualizer.measure();
      setWasMeasured(true);
      if (rowVirtualizer.getVirtualItems().length === 0) {
        rowVirtualizer.scrollToOffset(0);
      }
    });
    return () => cancelAnimationFrame(id);
  }, [open, rowVirtualizer]);

  useEffect(() => {
    if (!open || !selectedValue || filtered.length === 0) return;

    const raf1 = requestAnimationFrame(() => {
      rowVirtualizer.measure();
      const idx = filtered.findIndex((it) => it.id === selectedValue);
      if (idx >= 0) {
        const rowIndex = Math.floor(idx / 3);
        const raf2 = requestAnimationFrame(() => {
          rowVirtualizer.scrollToIndex(rowIndex, { align: "center" });
        });
        return () => cancelAnimationFrame(raf2);
      }
    });

    return () => cancelAnimationFrame(raf1);
  }, [open, selectedValue, filtered.length, filtered, rowVirtualizer]);

  useEffect(() => {
    if (rows.length === 0) return;

    const id = requestAnimationFrame(() => {
      rowVirtualizer.measure();

      rowVirtualizer.scrollToIndex(0, { align: "start" });
    });

    return () => cancelAnimationFrame(id);
  }, [debouncedValue, rowVirtualizer, rows.length]);

  const virtualRows = rowVirtualizer.getVirtualItems();

  return (
    <Popover open={open} onOpenChange={setOpen} modal={true}>
      <PopoverTrigger asChild>
        <Button
          variant="combobox"
          role="combobox"
          disabled={isDisabled}
          data-invalid={dataInvalid}
          aria-invalid={dataInvalid}
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
          <div className="relative">
            <CommandInput
              placeholder="Search icons..."
              className={cn("h-9 pr-8")} // add space for the spinner
              value={query}
              onValueChange={setQuery}
            />
            {isPending && (
              <>
                <Loader2Icon
                  className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground pointer-events-none"
                  aria-hidden="true"
                />

                <span className="sr-only" role="status" aria-live="polite">
                  Searching…
                </span>
              </>
            )}
          </div>

          <CommandList ref={parentRef} className="max-h-[350px]  overflow-auto">
            {!wasMeasured && <SkeletonGrid rows={5} cols={3} rowHeight={76}></SkeletonGrid>}
            {rows.length === 0 && wasMeasured && <CommandEmpty>No icon found.</CommandEmpty>}
            {wasMeasured && (
              <CommandGroup>
                <div className="relative w-full" style={{ height: rowVirtualizer.getTotalSize() }}>
                  <div
                    className="absolute top-0 left-0 w-full"
                    style={{
                      transform: `translateY(${virtualRows[0]?.start ?? 0}px)`,
                    }}
                  >
                    {virtualRows.map((vRow) => {
                      const row = rows[vRow.index];
                      return (
                        <div
                          key={vRow.key}
                          data-index={vRow.index}
                          ref={rowVirtualizer.measureElement}
                          className="grid grid-cols-3 gap-0.5 p-1"
                        >
                          {row.map((icon) => (
                            <IconItem
                              key={icon.id}
                              icon={icon}
                              isSelected={selectedValue === icon.id}
                              onSelect={(id, label) => {
                                onSelect(id, label);
                                setOpen(false);
                              }}
                            />
                          ))}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </CommandGroup>
            )}
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

function SkeletonGrid({
  rows = 5,
  cols = 3,
  rowHeight = 76, // must match virtualizer's estimateSize
}: {
  rows?: number;
  cols?: number;
  rowHeight?: number;
}) {
  // Total spacer height to match virtual list container height while loading
  const totalHeight = rows * rowHeight;

  return (
    <div className="relative w-full" style={{ height: totalHeight }} aria-hidden="true">
      <div className="absolute top-0 left-0 w-full">
        {Array.from({ length: rows }).map((_, r) => (
          <div key={`skeleton-row-${r}`} className="grid grid-cols-3 gap-0.5 p-1" style={{ height: rowHeight }}>
            {Array.from({ length: cols }).map((__, c) => (
              <div key={`skeleton-cell-${r}-${c}`} className="flex flex-col items-center justify-center gap-1.5 p-2">
                {/* Icon circle */}
                <div className="h-8 w-8 rounded-md bg-muted animate-pulse" />
                {/* Label bar */}
                <div className="h-2 w-16 rounded bg-muted/80 animate-pulse" />
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

IconItem.displayName = "IconItem";
