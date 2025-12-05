import { TColors } from "@/lib/types";
import DynamicIcon, { IconName } from "../ui/icon-dynamic";
import { Button } from "../ui/button";
import { Loader2Icon } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { BadgeColored } from "../ui/badge-colored";
import { cn } from "@/lib/utils";

type DataSelectProps<T> = {
  list: T[] | undefined;
  selectedValue: string;
  isLoading: boolean;
  loadingLabel?: string;
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
  loadingLabel = "Collecting Data",
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
        variant={"outline"}
        disabled
        //className="flex w-fit items-center justify-between gap-2 shrink-0 h-9 flex-1 md:w-60"
      >
        <Loader2Icon className="animate-spin" />
        {loadingLabel}
      </Button>
    );
  }

  return (
    <Select value={selectedValue} onValueChange={onChange}>
      <SelectTrigger className={cn(className, "flex-1 w-full")}>
        <SelectValue />
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
