import { TColors } from "@/lib/types";
import DynamicIcon, { IconName } from "../ui/icon-dynamic";
import { Button } from "../ui/button";
import { Check, ChevronDownIcon, CircleX, Loader2Icon } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { BadgeColored } from "../ui/badge-colored";
import { cn } from "@/lib/utils";
import { ComboBox, ComboBoxTrigger } from "../ui/combobox";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "../ui/command";
import { useMemo, useState } from "react";
import { MultiSelect, MultiSelectOption } from "../multi-select/multi-select";

type DataSelectProps<T> = {
  list: T[] | undefined;
  selectedValues: string[];
  isLoading: boolean;
  isDisabled: boolean;
  isError?: boolean;
  loadingLabel: string;
  placeholderText: string;
  placeholderBadge?: { label: string };
  searchText: string;
  noResultText: string;
  dataInvalid?: boolean;
  onValueChange: (values: string[]) => void;
  getId: (item: T) => string;
  getLabel: (item: T) => string;
  getIcon?: (item: T) => IconName;
  getColor?: (item: T) => TColors;
  className?: string;
  maxCount?: number;
  hideSelectAll?: boolean;
  hideIcon?: boolean;
  hideMoreLabel?: boolean;
  hideClearAll?: boolean;
  hideClearSingle?: boolean;
  searchable?: boolean;
  modalPopover?: boolean;
  selectAllBadge?: MultiSelectOption;
};

export function GenericMultiSelect<T>({
  list,
  selectedValues,
  isLoading,
  isDisabled,
  isError,
  loadingLabel = "Collecting Data",
  placeholderText = "Click to Select",
  placeholderBadge,
  searchText = "Search...",
  noResultText = "No Item Found",
  dataInvalid = false,
  onValueChange,
  getId,
  getLabel,
  getIcon,
  getColor,
  className,
  hideSelectAll = true,
  hideIcon = false,
  hideMoreLabel = false,
  hideClearAll = false,
  hideClearSingle = false,
  searchable = true,
  modalPopover = true,
  selectAllBadge,
}: DataSelectProps<T>) {
  const options = useMemo(() => {
    if (!list) return [];
    return list.map((item) => ({
      label: getLabel(item),
      value: getId(item),
      icon: getIcon && getIcon(item),
      color: getColor && getColor(item),
    }));
  }, [list, getLabel, getId, getIcon, getColor]);

  if (isLoading || !list) {
    return (
      <Button
        data-invalid={dataInvalid}
        aria-invalid={dataInvalid}
        variant={"combobox"}
        disabled
        className={cn("min-w-[200px]", className)}
      >
        {isError ? <CircleX /> : <Loader2Icon className="animate-spin" />}
        {loadingLabel}
      </Button>
    );
  }

  return (
    <div className={cn("w-full", className)} data-invalid={dataInvalid}>
      <MultiSelect
        options={options}
        onValueChange={onValueChange}
        defaultValue={selectedValues}
        placeholder={placeholderText}
        placeholderBadge={placeholderBadge}
        searchText={searchText}
        noResultText={noResultText}
        disabled={isDisabled}
        selectAllBadge={selectAllBadge}
        hideSelectAll={hideSelectAll}
        className={cn(dataInvalid && "border-destructive")}
        hideIcon={hideIcon}
        hideMoreLabel={hideMoreLabel}
        hideClearAll={hideClearAll}
        hideClearSingle={hideClearSingle}
        searchable={searchable}
        modalPopover={modalPopover}
      />
    </div>
  );
}
