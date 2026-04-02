import React from "react";
import { XIcon, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface ClearButtonProps {
  onClick: () => void;
  totalSelected: number;
  isFocused: boolean;
}

/**
 * Button to clear all selected options
 */
export const ClearButton = ({ onClick, totalSelected, isFocused }: ClearButtonProps) => (
  <div
    role="button"
    tabIndex={-1}
    onClick={(e) => {
      e.stopPropagation();
      onClick();
    }}
    onKeyDown={(e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.stopPropagation();
        onClick();
      }
    }}
    aria-label={`Clear all ${totalSelected} selected options`}
    className={cn(
      "flex items-center justify-center h-4 w-4 mx-2 text-muted-foreground rounded-sm cursor-auto",
      "cursor-pointer hover:text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1 ",
      isFocused && "ring-2 ring-ring ring-offset-1 ",
    )}
  >
    <XIcon className="h-4 w-4" />
  </div>
);

interface ChevronButtonProps {
  onClick: () => void;
  isFocused: boolean;
}

/**
 * Button to open/close the popover
 */
export const ChevronButton = ({ onClick, isFocused }: ChevronButtonProps) => (
  <div
    role="button"
    tabIndex={-1}
    onClick={(e) => {
      e.stopPropagation();
      onClick();
    }}
    onKeyDown={(e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.stopPropagation();
        onClick();
      }
    }}
    className={cn(
      "flex items-center justify-center h-4 w-4 mx-2 text-muted-foreground rounded-sm cursor-auto",
      "cursor-pointer hover:text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1 ",
      isFocused && "ring-2 ring-ring ring-offset-1 ",
    )}
  >
    <ChevronDown className="h-4 w-4" />
  </div>
);
