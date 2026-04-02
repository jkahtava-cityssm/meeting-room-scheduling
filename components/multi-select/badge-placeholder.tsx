import React from "react";
import { cn } from "@/lib/utils";
import { badgeVariants, Badge } from "@/components/ui/badge";
import { multiSelectVariants, type MultiSelectVariantProps } from "./multi-select.types";

interface GhostBadgeProps {
  label: string;
  hasIcon: boolean;
  compactMode: boolean;
  disabled: boolean;
  hideClearSingle: boolean;
  hideIcon: boolean;
}

/**
 * Ghost badge used for measuring text width (invisible version of MultiSelectBadge)
 */
export const GhostBadge = ({ label, hasIcon, compactMode, disabled, hideClearSingle, hideIcon }: GhostBadgeProps) => (
  <div
    className={cn(
      badgeVariants({ variant: "default" }),
      multiSelectVariants({ variant: "default" }),
      "flex items-center whitespace-nowrap rounded-md border font-normal  text-md",
      compactMode && "text-xs px-1.5 py-0.5",
    )}
    aria-hidden="true"
  >
    {!disabled && !hideClearSingle && <div className="mr-1 h-3 w-3 shrink-0" />}

    {hasIcon && !hideIcon && (
      <div className={cn("flex items-center justify-center shrink-0", compactMode ? "h-3 w-3" : "h-4 w-4")} />
    )}

    <span className="truncate">{label}</span>
  </div>
);

interface BadgePlaceholderProps {
  placeholderBadge?: { label: string };
  variant?: MultiSelectVariantProps["variant"];
  compactMode: boolean;
  placeholder: string;
}

/**
 * Placeholder badge shown when no items are selected
 */
export const BadgePlaceholder = ({ placeholderBadge, variant, compactMode, placeholder }: BadgePlaceholderProps) => (
  <div className="flex items-center">
    {placeholderBadge && (
      <Badge className={cn(multiSelectVariants({ variant }), compactMode && "text-xs px-1.5 py-0.5")}>
        {placeholderBadge.label}
      </Badge>
    )}
    <span className="text-sm font-normal text-muted-foreground mx-3">{placeholder}</span>
  </div>
);
