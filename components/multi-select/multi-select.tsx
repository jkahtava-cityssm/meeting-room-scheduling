import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import {
  CheckIcon,
  XCircle,
  ChevronDown,
  XIcon,
  WandSparkles,
  LucideFilter,
  LucideX,
  LucideTrash2,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";
import { Button, buttonVariants } from "@/components/ui/button";
import { Badge, badgeVariants } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { useMultiSelectAnnouncements } from "./use-multi-select-announcements";
import { useMultiSelectKeyboard } from "./use-multi-select-keyboard";
import { useOverflowDetection } from "./use-overflow-detection";
import DynamicIcon, { IconName } from "../ui/icon-dynamic";
import { TColors } from "@/lib/types";
import { BadgeColored } from "../ui/badge-colored";
import { Checkbox } from "../ui/checkbox";

/**
 * Variants for the multi-select component to handle different styles.
 * Uses class-variance-authority (cva) to define different styles based on "variant" prop.
 */
const multiSelectVariants = cva("transition-all duration-300 ease-in-out", {
  variants: {
    variant: {
      default: "border-foreground/10 text-foreground bg-card hover:bg-card/80 shadow-md ring-1 ring-white/10",
      secondary:
        "border-foreground/10 bg-secondary text-secondary-foreground hover:bg-secondary/80 shadow-md ring-1 ring-white/10",
      destructive:
        "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80 shadow-md ring-1 ring-white/10",
      inverted: "inverted",
    },
  },
  defaultVariants: {
    variant: "default",
  },
});

/**
 * Option interface for MultiSelect component
 */
interface MultiSelectOption {
  /** The text to display for the option. */
  label: string;
  /** The unique value associated with the option. */
  value: string;
  /** Optional icon component to display alongside the option. */
  icon?: IconName;
  color?: TColors;
  /** Whether this option is disabled */
  disabled?: boolean;
  /** Custom styling for the option */
  style?: {
    /** Custom badge color */
    badgeColor?: string;
    /** Custom icon color */
    iconColor?: string;
    /** Gradient background for badge */
    gradient?: string;
  };
}

/**
 * Group interface for organizing options
 */
interface MultiSelectGroup {
  /** Group heading */
  heading: string;
  /** Options in this group */
  options: MultiSelectOption[];
}

/**
 * Props for MultiSelect component
 */
interface MultiSelectProps extends VariantProps<typeof multiSelectVariants> {
  /**
   * An array of option objects or groups to be displayed in the multi-select component.
   */
  options: MultiSelectOption[] | MultiSelectGroup[];
  /**
   * Callback function triggered when the selected values change.
   * Receives an array of the new selected values.
   */
  onValueChange: (value: string[]) => void;

  /** The default selected values when the component mounts. */
  defaultValue?: string[];

  /**
   * Placeholder text to be displayed when no values are selected.
   * Optional, defaults to "Select options".
   */
  placeholder?: string;

  /**
   * A Placeholder Badge that will be displayed when no items are selected.
   * Optional, defaults to undefined.
   */
  placeholderBadge?: { label: string };

  /**
   * Search Text Placeholder to be displayed in the Command Input Search Box.
   * Optional, defaults to "Search options...".
   */
  searchText?: string;

  /**
   * No Data Text Placeholder to be displayed when no data is found.
   * Optional, defaults to "No results found.".
   */
  noResultText?: string;

  /**
   * Maximum number of items to display. Extra selected items will be summarized.
   * Optional, defaults to 3.
   */
  maxCount?: number;

  compactMode?: boolean;
  /**
   * The modality of the popover. When set to true, interaction with outside elements
   * will be disabled and only popover content will be visible to screen readers.
   * Optional, defaults to false.
   */
  modalPopover?: boolean;

  /**
   * If true, renders the multi-select component as a child of another component.
   * Optional, defaults to false.
   */
  asChild?: boolean;

  /**
   * Additional class names to apply custom styles to the multi-select component.
   * Optional, can be used to add custom styles.
   */
  className?: string;

  /**
   * If true, disables the select all functionality.
   * Optional, defaults to false.
   */
  hideSelectAll?: boolean;
  hideSelectAllIcon?: boolean;

  /**
   * If true, shows search functionality in the popover.
   * If false, hides the search input completely.
   * Optional, defaults to true.
   */
  searchable?: boolean;

  /**
   * Custom empty state message when no options match search.
   * Optional, defaults to "No results found."
   */
  emptyIndicator?: React.ReactNode;

  /**
   * If true, allows the component to grow and shrink with its content.
   * If false, uses fixed width behavior.
   * Optional, defaults to false.
   */
  autoSize?: boolean;

  /**
   * If true, shows badges in a single line with horizontal scroll.
   * If false, badges wrap to multiple lines.
   * Optional, defaults to false.
   */
  singleLine?: boolean;

  /**
   * Custom CSS class for the popover content.
   * Optional, can be used to customize popover appearance.
   */
  popoverClassName?: string;

  /**
   * If true, disables the component completely.
   * Optional, defaults to false.
   */
  disabled?: boolean;

  /**
   * Minimum width for the component.
   * Optional, defaults to auto-sizing based on content.
   * When set, component will not shrink below this width.
   */
  minWidth?: string;

  /**
   * Maximum width for the component.
   * Optional, defaults to 100% of container.
   * Component will not exceed container boundaries.
   */
  maxWidth?: string;

  /**
   * If true, automatically removes duplicate options based on their value.
   * Optional, defaults to false (shows warning in dev mode instead).
   */
  deduplicateOptions?: boolean;

  /**
   * If true, the component will reset its internal state when defaultValue changes.
   * Useful for React Hook Form integration and form reset functionality.
   * Optional, defaults to true.
   */
  resetOnDefaultValueChange?: boolean;

  /**
   * If true, automatically closes the popover after selecting an option.
   * Useful for single-selection-like behavior or mobile UX.
   * Optional, defaults to false.
   */
  closeOnSelect?: boolean;

  hideIcon?: boolean;
  hideMoreLabel?: boolean;
  hideClearAll?: boolean;
  hideClearSingle?: boolean;
  showSelectedButton?: boolean;
}

/**
 * Imperative methods exposed through ref
 */
export interface MultiSelectRef {
  /**
   * Programmatically reset the component to its default value
   */
  reset: () => void;
  /**
   * Get current selected values
   */
  getSelectedValues: () => string[];
  /**
   * Set selected values programmatically
   */
  setSelectedValues: (values: string[]) => void;
  /**
   * Clear all selected values
   */
  clear: () => void;
  /**
   * Focus the component
   */
  focus: () => void;
}

export const MultiSelect = React.forwardRef<MultiSelectRef, MultiSelectProps>(
  (
    {
      options,
      onValueChange,
      variant,
      defaultValue = [],
      placeholder = "Select options",
      placeholderBadge,
      searchText = "Search options...",
      noResultText = "No results found.",

      hideIcon = false,
      hideMoreLabel = true,
      showSelectedButton = false,
      hideClearAll = false,
      hideClearSingle = false,

      maxCount,
      compactMode = false,

      modalPopover = false,
      asChild = false,
      className,
      hideSelectAllIcon = false,
      hideSelectAll = false,
      searchable = true,
      emptyIndicator,
      autoSize = false,
      singleLine = true,
      popoverClassName,
      disabled = false,

      minWidth,
      maxWidth,
      deduplicateOptions = false,
      resetOnDefaultValueChange = true,
      closeOnSelect = false,
      ...props
    },
    ref,
  ) => {
    const [selectedValues, setSelectedValues] = React.useState<string[]>(defaultValue);
    const [isPopoverOpen, setIsPopoverOpen] = React.useState(false);

    const [focusedBadgeIndex, setFocusedBadgeIndex] = React.useState<number>(-1);

    // Reset focus when the popover opens/closes or search changes
    React.useEffect(() => {
      setFocusedBadgeIndex(-1);
    }, [isPopoverOpen]);

    const [searchValue, setSearchValue] = React.useState("");

    const [politeMessage, setPoliteMessage] = React.useState("");
    const [assertiveMessage, setAssertiveMessage] = React.useState("");

    const { containerRef, shadowRef, actionsRef, measurementLimit, visibleCount } = useOverflowDetection(
      selectedValues.length,
    );

    const timeoutRef = React.useRef<NodeJS.Timeout | null>(null);

    const announce = React.useCallback((message: string, priority: "polite" | "assertive" = "polite") => {
      const setMessage = priority === "assertive" ? setAssertiveMessage : setPoliteMessage;

      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      setMessage(message);

      timeoutRef.current = setTimeout(() => {
        setMessage("");
      }, 500);
    }, []);

    const multiSelectId = React.useId();
    const listboxId = `${multiSelectId}-listbox`;
    const triggerDescriptionId = `${multiSelectId}-description`;
    const selectedCountId = `${multiSelectId}-count`;

    const prevDefaultValueRef = React.useRef<string[]>(defaultValue);

    const isGroupedOptions = React.useCallback(
      (opts: MultiSelectOption[] | MultiSelectGroup[]): opts is MultiSelectGroup[] => {
        return opts.length > 0 && "heading" in opts[0];
      },
      [],
    );

    const arraysEqual = React.useCallback((a: string[], b: string[]): boolean => {
      if (a.length !== b.length) return false;
      const sortedA = [...a].sort();
      const sortedB = [...b].sort();
      return sortedA.every((val, index) => val === sortedB[index]);
    }, []);

    const resetToDefault = React.useCallback(() => {
      setSelectedValues(defaultValue);
      setIsPopoverOpen(false);
      setSearchValue("");
      onValueChange(defaultValue);
    }, [defaultValue, onValueChange]);

    const selectionList = React.useMemo(() => {
      if (options.length === 0) return [];

      const allOptions = isGroupedOptions(options) ? options.flatMap((group) => group.options) : options;

      if (!deduplicateOptions) return allOptions;

      const seen = new Set();
      const unique: MultiSelectOption[] = [];
      const duplicates: string[] = [];

      allOptions.forEach((option) => {
        if (seen.has(option.value)) {
          duplicates.push(option.value);
        } else {
          seen.add(option.value);
          unique.push(option);
        }
      });

      if (process.env.NODE_ENV === "development" && duplicates.length > 0) {
        const action = deduplicateOptions ? "automatically removed" : "detected";
        console.warn(
          `MultiSelect: Duplicate option values ${action}: ${duplicates.join(", ")}. ` +
            `${
              deduplicateOptions
                ? "Duplicates have been removed automatically."
                : "This may cause unexpected behavior. Consider setting 'deduplicateOptions={true}' or ensure all option values are unique."
            }`,
        );
      }
      return unique;
    }, [isGroupedOptions, options, deduplicateOptions]);

    const optionsMap = React.useMemo(() => {
      return new Map(selectionList.map((opt) => [opt.value, opt]));
    }, [selectionList]);

    const getOptionByValue = React.useCallback(
      (value: string) => {
        const option = optionsMap.get(value);
        if (!option && process.env.NODE_ENV === "development") {
          console.warn(`MultiSelect: Option with value "${value}" not found in options list`);
        }
        return option;
      },
      [optionsMap],
    );

    const filteredOptions = React.useMemo(() => {
      if (!searchable || !searchValue) return options;
      if (options.length === 0) return [];
      if (isGroupedOptions(options)) {
        return options
          .map((group) => ({
            ...group,
            options: group.options.filter(
              (option) =>
                option.label.toLowerCase().includes(searchValue.toLowerCase()) ||
                option.value.toLowerCase().includes(searchValue.toLowerCase()),
            ),
          }))
          .filter((group) => group.options.length > 0);
      }
      return options.filter(
        (option) =>
          option.label.toLowerCase().includes(searchValue.toLowerCase()) ||
          option.value.toLowerCase().includes(searchValue.toLowerCase()),
      );
    }, [options, searchValue, searchable, isGroupedOptions]);

    const { maxBadgeIndex, clearButtonIndex, lastBadgeIndex, chevronIndex } = React.useMemo(
      () => getNavigationIndices(selectedValues.length, visibleCount, disabled),
      [selectedValues.length, visibleCount, disabled],
    );

    const onValueChangeRef = React.useRef(onValueChange);

    React.useLayoutEffect(() => {
      onValueChangeRef.current = onValueChange;
    }, [onValueChange]);

    const toggleOption = React.useCallback(
      (optionValue: string) => {
        if (disabled) return;
        setSelectedValues((prev) =>
          prev.includes(optionValue) ? prev.filter((v) => v !== optionValue) : [...prev, optionValue],
        );
        if (closeOnSelect) setIsPopoverOpen(false);
      },
      [disabled, closeOnSelect],
    );

    React.useEffect(() => {
      onValueChangeRef.current?.(selectedValues);
    }, [selectedValues]);

    const handleClear = React.useCallback(() => {
      if (disabled) return;
      setSelectedValues([]);
      onValueChange([]);
      announce("All items cleared", "assertive");
    }, [announce, disabled, onValueChange]);

    const handleTogglePopover = (value: boolean) => {
      if (disabled) return;

      if (value) {
        setSearchValue("");
      }

      setIsPopoverOpen(value);
    };

    const clearExtraOptions = React.useCallback(() => {
      if (disabled) return;

      const newSelectedValues = selectedValues.slice(0, visibleCount);

      setSelectedValues(newSelectedValues);
      onValueChange(newSelectedValues);
    }, [disabled, visibleCount, onValueChange, selectedValues]);

    const toggleAll = () => {
      if (disabled) return;
      const allOptions = selectionList.filter((option) => !option.disabled);
      if (selectedValues.length === allOptions.length) {
        handleClear();
      } else {
        const allValues = allOptions.map((option) => option.value);
        setSelectedValues(allValues);
        onValueChange(allValues);
      }

      if (closeOnSelect) {
        setIsPopoverOpen(false);
      }
    };

    const buttonRef = React.useRef<HTMLDivElement>(null);

    React.useImperativeHandle(
      ref,
      () => ({
        reset: resetToDefault,
        getSelectedValues: () => selectedValues,
        setSelectedValues: (values: string[]) => {
          setSelectedValues(values);
          onValueChange(values);
        },
        clear: handleClear,
        focus: () => buttonRef.current?.focus(),
      }),
      [resetToDefault, handleClear, selectedValues, onValueChange],
    );

    React.useEffect(() => {
      if (selectedValues.length === 0 && focusedBadgeIndex !== -1) {
        setFocusedBadgeIndex(-1);
      }
    }, [selectedValues.length, focusedBadgeIndex, lastBadgeIndex]);

    React.useEffect(() => {
      if (!resetOnDefaultValueChange) return;
      const prevDefaultValue = prevDefaultValueRef.current;
      if (!arraysEqual(prevDefaultValue, defaultValue)) {
        if (!arraysEqual(selectedValues, defaultValue)) {
          setSelectedValues(defaultValue);
        }
        prevDefaultValueRef.current = [...defaultValue];
      }
    }, [defaultValue, selectedValues, arraysEqual, resetOnDefaultValueChange]);

    useMultiSelectAnnouncements({
      selectedValues,
      isPopoverOpen,
      searchValue,
      selectionList,
      announce,
    });

    const { handleKeyDown } = useMultiSelectKeyboard({
      disabled,
      isPopoverOpen,
      searchValue,
      selectedValues,
      focusedBadgeIndex,
      setFocusedBadgeIndex,
      lastBadgeIndex,
      clearButtonIndex,
      maxBadgeIndex,
      chevronIndex,
      toggleOption,
      handleClear,
      clearExtraOptions,
      setIsPopoverOpen,
    });

    return (
      <>
        <div className="sr-only">
          <div aria-live="polite" aria-atomic="true" role="status">
            {politeMessage}
          </div>
          <div aria-live="assertive" aria-atomic="true" role="alert">
            {assertiveMessage}
          </div>
        </div>

        <Popover open={isPopoverOpen} onOpenChange={handleTogglePopover} modal={modalPopover}>
          <div id={triggerDescriptionId} className="sr-only">
            Multi-select dropdown. Use arrow keys to navigate, Enter to select, and Escape to close.
          </div>
          <div id={selectedCountId} className="sr-only" aria-live="polite">
            {selectedValues.length === 0
              ? "No options selected"
              : `${selectedValues.length} option${selectedValues.length === 1 ? "" : "s"} selected: ${selectedValues
                  .map((value) => getOptionByValue(value)?.label)
                  .filter(Boolean)
                  .join(", ")}`}
          </div>

          <PopoverTrigger asChild>
            <div
              ref={buttonRef}
              tabIndex={0}
              onKeyDown={handleKeyDown}
              onBlur={(event) => {
                if (!event.currentTarget.contains(event.relatedTarget as Node)) {
                  setFocusedBadgeIndex(-1);
                }
              }}
              role="combobox"
              aria-expanded={isPopoverOpen}
              aria-haspopup="listbox"
              aria-controls={isPopoverOpen ? listboxId : undefined}
              aria-describedby={`${triggerDescriptionId} ${selectedCountId}`}
              aria-label={`Multi-select: ${selectedValues.length} of ${selectionList.length} options selected. ${placeholder}`}
              className={cn(
                buttonVariants({ variant: "combobox" }),
                "flex p-1 rounded-md border h-9  items-center justify-between bg-inherit hover:bg-inherit", // [&_svg]:pointer-events-auto

                disabled && "opacity-50 cursor-not-allowed",

                className,
              )}
            >
              <div className="relative w-full">
                <div
                  ref={shadowRef}
                  className="flex items-center gap-2 p-1 absolute opacity-0 pointer-events-none whitespace-nowrap"
                  style={{ visibility: "hidden", left: 0, top: 0, zIndex: -1 }}
                  aria-hidden="true"
                >
                  {selectedValues.slice(0, measurementLimit).map((value) => (
                    <GhostBadge
                      key={`shadow-${value}`}
                      label={getOptionByValue(value)?.label ?? ""}
                      hasIcon={
                        (getOptionByValue(value)?.icon !== undefined && getOptionByValue(value)?.color !== undefined) ??
                        false
                      }
                      compactMode={compactMode}
                      disabled={disabled}
                      hideClearSingle={hideClearSingle}
                      hideIcon={hideIcon}
                    />
                  ))}
                  <div data-shadow-plus>
                    <GhostBadge
                      label={hideMoreLabel ? `${selectedValues.length}` : `+ ${selectedValues.length} more`}
                      hasIcon={false}
                      compactMode={compactMode}
                      disabled={disabled}
                      hideClearSingle={hideClearSingle}
                      hideIcon={hideIcon}
                    />
                  </div>
                </div>
                <div ref={containerRef} className="flex justify-between items-center w-full">
                  {/* 1. Selected Options Area */}
                  <div className={cn("flex items-center gap-2 p-1 overflow-hidden", compactMode && "gap-0.5")}>
                    {selectedValues.length > 0 ? (
                      <>
                        {selectedValues.slice(0, visibleCount).map((value, index) => (
                          <MultiSelectBadge
                            key={value}
                            isFocused={focusedBadgeIndex === index}
                            option={getOptionByValue(value)}
                            onAction={(e) => {
                              e.stopPropagation();
                              toggleOption(value);
                              setFocusedBadgeIndex(-1);
                            }}
                            disabled={disabled}
                            variant={variant}
                            singleLine={singleLine}
                            compactMode={compactMode}
                            hideClearSingle={hideClearSingle}
                            hideIcon={hideIcon}
                          />
                        ))}
                        {selectedValues.length > visibleCount && (
                          <MultiSelectBadge
                            isFocused={focusedBadgeIndex === maxBadgeIndex}
                            isMaxCount
                            label={
                              hideMoreLabel
                                ? `+ ${selectedValues.length - visibleCount}`
                                : `+ ${selectedValues.length - visibleCount} more`
                            }
                            onAction={(e) => {
                              e.stopPropagation();
                              clearExtraOptions();
                              setFocusedBadgeIndex(-1);
                            }}
                            disabled={disabled}
                            variant={variant}
                            singleLine={singleLine}
                            compactMode={compactMode}
                            hideClearSingle={hideClearSingle}
                            hideIcon={hideIcon}
                          />
                        )}
                      </>
                    ) : (
                      <BadgePlaceholder
                        placeholderBadge={placeholderBadge}
                        variant={variant}
                        placeholder={placeholder}
                        compactMode={compactMode}
                      />
                    )}
                  </div>

                  {/* 2. Action Area (Clear & Chevron) */}
                  <div ref={actionsRef} className="flex items-center">
                    {!disabled && selectedValues.length > 0 && !hideClearAll && (
                      <ClearButton
                        onClick={handleClear}
                        totalSelected={selectedValues.length}
                        isFocused={focusedBadgeIndex === clearButtonIndex}
                      />
                    )}
                    {!disabled && <Separator orientation="vertical" className="flex min-h-6 h-full mx-1" />}
                    {!disabled && (
                      <ChevronButton
                        onClick={() => setIsPopoverOpen(true)}
                        isFocused={focusedBadgeIndex === chevronIndex}
                      ></ChevronButton>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </PopoverTrigger>
          <PopoverContent
            id={listboxId}
            role="listbox"
            aria-multiselectable="true"
            aria-label="Available options"
            className={cn("w-full min-w-(--radix-popover-trigger-width) p-0", "touch-manipulation", popoverClassName)}
            align="start"
            onEscapeKeyDown={() => setIsPopoverOpen(false)}
          >
            <Command shouldFilter={false}>
              {searchable && (
                <>
                  <CommandInput
                    placeholder={searchText}
                    onKeyDown={handleKeyDown}
                    value={searchValue}
                    onValueChange={setSearchValue}
                    aria-label="Search options"
                    aria-describedby={`${multiSelectId}-search-help`}
                  />
                  <div id={`${multiSelectId}-search-help`} className="sr-only">
                    Type to filter options. Use arrow keys to navigate.
                  </div>
                </>
              )}

              <CommandList
                className={cn("max-h-[300px] overflow-y-auto multiselect-scrollbar", "overscroll-behavior-y-contain")}
              >
                <CommandEmpty>{emptyIndicator || noResultText}</CommandEmpty>
                {/* Options List */}
                {isGroupedOptions(filteredOptions) ? (
                  filteredOptions.map((group) => (
                    <CommandGroup key={group.heading} heading={group.heading}>
                      {group.options.map((opt) => (
                        <OptionItem
                          key={opt.value}
                          option={opt}
                          isSelected={selectedValues.includes(opt.value)}
                          onToggle={toggleOption}
                        />
                      ))}
                    </CommandGroup>
                  ))
                ) : (
                  <CommandGroup>
                    {!hideSelectAll && !searchValue && (
                      <CommandItem onSelect={toggleAll} className="cursor-pointer">
                        <div
                          className={cn(
                            "flex items-center justify-center text-current transition-none  size-4 shrink-0 rounded-[4px]  border shadow-xs transition-shadow outline-none border-input dark:bg-input/30",
                            selectedValues.length === selectionList.filter((o) => !o.disabled).length &&
                              "border-primary bg-primary dark:bg-primary",
                          )}
                          aria-hidden="true"
                        >
                          {selectedValues.length === selectionList.filter((o) => !o.disabled).length && (
                            <CheckIcon className="size-3.5 text-primary-foreground" />
                          )}
                        </div>
                        {!hideSelectAllIcon && (
                          <BadgeColored color={"zinc"} className="h-6 w-6">
                            <DynamicIcon hideBackground={true} color={"zinc"} name={"asterisk"}></DynamicIcon>
                          </BadgeColored>
                        )}
                        <span>Select All</span>
                      </CommandItem>
                    )}
                    {filteredOptions.map((opt) => (
                      <OptionItem
                        key={opt.value}
                        option={opt}
                        isSelected={selectedValues.includes(opt.value)}
                        onToggle={toggleOption}
                      />
                    ))}
                  </CommandGroup>
                )}
              </CommandList>
              <CommandFooter
                onClear={handleClear}
                onClose={() => setIsPopoverOpen(false)}
                showClear={selectedValues.length > 0}
                showSelectedButton={showSelectedButton}
              />
            </Command>
          </PopoverContent>
        </Popover>
      </>
    );
  },
);

const getNavigationIndices = (count: number, maxVisible: number, isDisabled: boolean) => {
  const visibleChipsCount = Math.min(count, maxVisible);
  const hasMaxBadge = count > maxVisible;
  const hasClearButton = !isDisabled && count > 0;
  const maxBadgeIndex = hasMaxBadge ? visibleChipsCount : -1;
  const clearButtonIndex = hasClearButton ? (hasMaxBadge ? maxBadgeIndex + 1 : visibleChipsCount) : -1;

  return {
    maxBadgeIndex,
    clearButtonIndex,
    lastBadgeIndex: hasClearButton ? clearButtonIndex : hasMaxBadge ? maxBadgeIndex : visibleChipsCount - 1,
    chevronIndex: clearButtonIndex + 1,
  };
};

const MultiSelectBadge = React.memo(
  function MultiSelectBadge({
    isFocused,
    label,
    isMaxCount = false,
    option,
    disabled,
    variant,

    hideIcon = false,
    hideClearSingle = false,
    compactMode,
    singleLine,
    onAction,
  }: {
    isFocused: boolean;
    label?: string;
    isMaxCount?: boolean;
    option?: MultiSelectOption;
    disabled: boolean;
    variant: VariantProps<typeof multiSelectVariants>["variant"];

    maxCount?: number;
    hideClearSingle?: boolean;
    hideIcon?: boolean;
    compactMode: boolean;
    singleLine: boolean;
    onAction: (event: React.MouseEvent<SVGSVGElement, MouseEvent>) => void;
  }) {
    const customStyle = option?.style;

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
              //e.stopPropagation();
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

const GhostBadge = ({
  label,
  hasIcon,
  compactMode,
  disabled,
  hideClearSingle,
  hideIcon,
}: {
  label: string;
  hasIcon: boolean;
  compactMode: boolean;
  disabled: boolean;
  hideClearSingle: boolean;
  hideIcon: boolean;
}) => (
  <div
    className={cn(
      badgeVariants({ variant: "default" }),
      multiSelectVariants({ variant: "default" }),
      "flex items-center whitespace-nowrap rounded-md border font-normal  text-md", // Match standard Badge base
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

const BadgePlaceholder = ({
  placeholderBadge,
  variant,
  compactMode,
  placeholder,
}: {
  placeholderBadge?: { label: string };
  variant: VariantProps<typeof multiSelectVariants>["variant"];
  compactMode: boolean;
  placeholder: string;
}) => (
  <div className="flex items-center">
    {placeholderBadge && (
      <Badge className={cn(multiSelectVariants({ variant }), compactMode && "text-xs px-1.5 py-0.5")}>
        {placeholderBadge.label}
      </Badge>
    )}
    <span className="text-sm font-normal text-muted-foreground mx-3">{placeholder}</span>
  </div>
);

const ClearButton = ({
  onClick,
  totalSelected,
  isFocused,
}: {
  onClick: () => void;
  totalSelected: number;
  isFocused: boolean;
}) => (
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

const ChevronButton = ({
  onClick,

  isFocused,
}: {
  onClick: () => void;

  isFocused: boolean;
}) => (
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

const OptionItem = React.memo(
  function OptionItem({
    option,
    isSelected,
    onToggle,
  }: {
    option: MultiSelectOption;
    isSelected: boolean;
    onToggle: (value: string) => void;
  }) {
    return (
      <CommandItem
        key={option.value}
        onSelect={() => onToggle(option.value)}
        value={option.value}
        keywords={[option.label]}
        role="option"
        aria-selected={isSelected}
        aria-disabled={option.disabled}
        aria-label={`${option.label}${isSelected ? ", selected" : ", not selected"}${option.disabled ? ", disabled" : ""}`}
        className={cn("cursor-pointer", option.disabled && "opacity-50 cursor-not-allowed")}
        disabled={option.disabled}
      >
        <div
          className={cn(
            "flex items-center justify-center text-current transition-none  size-4 shrink-0 rounded-[4px]  border shadow-xs transition-shadow outline-none border-input dark:bg-input/30",
            isSelected && "border-primary bg-primary dark:bg-primary",
          )}
          aria-hidden="true"
        >
          {isSelected && <CheckIcon className="size-3.5 text-primary-foreground" />}
        </div>
        {option.icon && option.color && (
          <BadgeColored color={option.color} className="h-6 w-6">
            <DynamicIcon hideBackground={true} color={option.color} name={option.icon}></DynamicIcon>
          </BadgeColored>
        )}
        <span className="truncate">{option.label}</span>
      </CommandItem>
    );
  },
  (prev, next) => {
    return (
      prev.isSelected === next.isSelected &&
      prev.option.value === next.option.value &&
      prev.option.disabled === next.option.disabled &&
      prev.option.label === next.option.label
    );
  },
);

const CommandFooter = ({
  onClear,
  onClose,
  showClear,
  showSelectedButton,
}: {
  onClear: () => void;
  onClose: () => void;
  showClear: boolean;
  showSelectedButton: boolean;
}) => (
  <div className="flex items-center justify-between p-1 bg-accent gap-2 rounded-md">
    {showClear && (
      <Button
        variant={"outline_destructive"}
        onClick={onClear}
        className="flex-1 justify-center cursor-pointer text-xs py-2 dark:bg-input/30"
      >
        <LucideTrash2 />
        Clear
      </Button>
    )}
    {showSelectedButton && (
      <Button
        variant={"outline"}
        onClick={() => {
          console.log("Selected");
        }}
        className="flex-1 justify-center cursor-pointer text-xs py-2"
      >
        <LucideFilter />
        Show Selected
      </Button>
    )}
    <Button variant={"outline"} onClick={onClose} className="flex-1 justify-center cursor-pointer text-xs py-2 ">
      <LucideX />
      Close
    </Button>
  </div>
);

MultiSelect.displayName = "MultiSelect";
export type { MultiSelectOption, MultiSelectGroup, MultiSelectProps };
