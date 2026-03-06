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
import { useState } from "react";

type DataSelectProps<T> = {
  list: T[] | undefined;
  selectedValue: string | undefined;
  isLoading: boolean;
  isDisabled: boolean;
  isError?: boolean;
  loadingLabel: string;
  placeholderText: string;
  searchText: string;
  noResultText: string;
  dataInvalid?: boolean;
  onSelect: (id: string, label: string) => void;
  getId: (item: T) => string;
  getLabel: (item: T) => string;
  getColor?: (item: T) => TColors;
  getIcon?: (item: T) => IconName;
  className?: string;
};

export function GenericComboBox<T>({
  list,
  selectedValue,
  isLoading,
  isDisabled,
  isError,
  loadingLabel = "Collecting Data",
  placeholderText = "Click to Select",
  searchText = "Search...",
  noResultText = "No Item Found",
  dataInvalid = false,
  onSelect,
  getId,
  getLabel,
  getColor,
  getIcon,
  className,
}: DataSelectProps<T>) {
  const selectedItem = list?.find((item) => getId(item) === selectedValue);

  const [open, setOpen] = useState(false);

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

  if (isDisabled) {
    return (
      <Button
        data-invalid={dataInvalid}
        aria-invalid={dataInvalid}
        variant={"combobox"}
        disabled
        className={cn("min-w-[200px]", className)}
      >
        {selectedItem ? getLabel(selectedItem) : ""}
      </Button>
    );
  }

  return (
    <Popover open={open} onOpenChange={setOpen} modal={true}>
      <PopoverTrigger asChild>
        <Button
          variant="combobox"
          role="combobox"
          className={cn(
            "min-w-[200px] justify-between text-sm font-normal",
            !selectedValue && "text-muted-foreground",
            dataInvalid && "",
            className,
          )}
          disabled={isDisabled}
          data-invalid={dataInvalid}
          aria-invalid={dataInvalid}
        >
          <span className="truncate">{selectedItem ? getLabel(selectedItem) : placeholderText}</span>

          <ChevronDownIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
        <Command>
          <CommandInput placeholder={searchText} className="h-9" />
          <CommandList>
            <CommandEmpty>{noResultText}</CommandEmpty>
            <CommandGroup>
              {list?.map((item) => {
                const id = getId(item);
                const label = getLabel(item);
                return (
                  <CommandItem
                    key={id}
                    value={label}
                    onSelect={() => {
                      onSelect(id, label);
                      setOpen(false);
                    }}
                  >
                    <span className="truncate">{label}</span>
                    <Check className={cn("ml-auto h-4 w-4", selectedValue === id ? "opacity-100" : "opacity-0")} />
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
