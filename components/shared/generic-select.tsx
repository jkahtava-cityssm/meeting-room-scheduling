import { TColors } from "@/lib/types";
import DynamicIcon, { IconName } from "../ui/icon-dynamic";
import { Button } from "../ui/button";
import { CircleX, Loader2Icon } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { BadgeColored } from "../ui/badge-colored";
import { cn } from "@/lib/utils";

type DataSelectProps<T> = {
  list: T[] | undefined;
  selectedValue: string;
  isLoading: boolean;
  isError?: boolean;
  isDisabled?: boolean;
  loadingLabel?: string;
  placeholderText?: string;
  dataInvalid?: boolean;
  onChange: (value: string) => void;
  getId: (item: T) => string;
  getLabel: (item: T) => string;
  getColor?: (item: T) => TColors;
  getIcon?: (item: T) => IconName;
  className?: string;
};

export function GenericSelect<T>({
  list,
  selectedValue,
  isLoading,
  isError,
  isDisabled,
  loadingLabel = "Collecting Data",
  placeholderText = "Select an option",
  dataInvalid = false,
  onChange,
  getId,
  getLabel,
  getColor,
  getIcon,
  className,
}: DataSelectProps<T>) {
  if (isLoading || !list) {
    return (
      <Button
        data-invalid={dataInvalid}
        aria-invalid={dataInvalid}
        variant={"combobox"}
        disabled
        className={cn("min-w-[200px]", className)}
      >
        {isError ? <CircleX /> : <Loader2Icon className="animate-spin " />}
        {loadingLabel}
      </Button>
    );
  }

  if (isDisabled) {
    const selectedItem = list.find((item) => getId(item) === selectedValue);
    return (
      <Button
        data-invalid={dataInvalid}
        aria-invalid={dataInvalid}
        variant={"combobox"}
        disabled
        className={cn("min-w-[200px]", className)}
      >
        {selectedItem && getColor && getIcon && (
          <BadgeColored color={getColor(selectedItem)} className="h-6 w-6">
            <DynamicIcon
              hideBackground={true}
              color={getColor(selectedItem)}
              name={getIcon(selectedItem)}
            ></DynamicIcon>
          </BadgeColored>
        )}
        {selectedItem ? getLabel(selectedItem) : ""}
      </Button>
    );
  }

  return (
    <Select value={selectedValue} onValueChange={onChange}>
      <SelectTrigger aria-invalid={dataInvalid} data-invalid={dataInvalid} className={cn("min-w-[200px]", className)}>
        <SelectValue placeholder={placeholderText} />
      </SelectTrigger>

      <SelectContent align="end">
        {list.map((item) => (
          <SelectItem key={getId(item)} value={getId(item)} className="flex-1">
            <div className="flex items-center gap-2 w-full text-sm">
              {getColor && getIcon && (
                <BadgeColored color={getColor(item)} className="h-6 w-6">
                  <DynamicIcon hideBackground={true} color={getColor(item)} name={getIcon(item)}></DynamicIcon>
                </BadgeColored>
              )}
              {getLabel(item)}
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
