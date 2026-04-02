import React from "react";
import { XCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import DynamicIcon from "../ui/icon-dynamic";
import { type MultiSelectOption, type MultiSelectVariantProps, multiSelectVariants } from "./multi-select.types";

interface MultiSelectBadgeProps {
  isFocused: boolean;
  label?: string;
  isMaxCount?: boolean;
  option?: MultiSelectOption;
  disabled: boolean;
  variant?: MultiSelectVariantProps["variant"];
  maxCount?: number;
  hideClearSingle?: boolean;
  hideIcon?: boolean;
  compactMode: boolean;
  singleLine: boolean;
  onAction: (event: React.MouseEvent<SVGSVGElement, MouseEvent>) => void;
}

/**
 * Badge displaying a selected option with clear functionality
 */
export const MultiSelectBadge = React.memo(
  function MultiSelectBadge({
    isFocused,
    label,
    isMaxCount = false,
    option,
    disabled,
    variant,
    hideClearSingle = false,
    hideIcon = false,
    compactMode,
    singleLine,
    onAction,
  }: MultiSelectBadgeProps) {
    return (
      <Badge
        aria-readonly={disabled}
        className={cn(
          multiSelectVariants({ variant }),
          "[&>svg]:pointer-events-auto aria-readonly:cursor-auto text-md",
          compactMode && "text-xs px-1.5 py-0.5",
          singleLine && "shrink-0 whitespace-nowrap",
          "transition-all duration-75",
          isFocused && "ring-2 ring-ring ring-offset-1 ",
        )}
      >
        {!disabled && !hideClearSingle && (
          <XCircle
            role="button"
            className={cn("h-3 w-3 cursor-pointer opacity-70 hover:opacity-100 mr-1")}
            onClick={(e) => {
              onAction(e);
            }}
          />
        )}
        {option?.icon && option?.color && !hideIcon && (
          <span className={cn("flex items-center justify-center shrink-0", compactMode ? "h-3 w-3" : "h-4 w-4")}>
            <DynamicIcon hideBackground={true} color={option.color} name={option.icon}></DynamicIcon>
          </span>
        )}

        <span className={cn("truncate font-normal")}>{isMaxCount ? label : option?.label}</span>
      </Badge>
    );
  },
  (prev, next) => {
    return (
      prev.option?.value === next.option?.value &&
      prev.isFocused === next.isFocused &&
      prev.label === next.label &&
      prev.disabled === next.disabled &&
      prev.hideClearSingle === next.hideClearSingle &&
      prev.onAction === next.onAction
    );
  },
);

MultiSelectBadge.displayName = "MultiSelectBadge";
