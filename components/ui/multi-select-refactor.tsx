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
  icon?: React.ComponentType<{ className?: string }>;
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
  hideIcons?: boolean;
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

      maxCount,
      compactMode = false,
      hideIcons = false,
      modalPopover = false,
      asChild = false,
      className,
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

    const { maxBadgeIndex, clearButtonIndex, lastBadgeIndex } = React.useMemo(
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

        setSelectedValues((prev) => {
          const next = prev.includes(optionValue) ? prev.filter((v) => v !== optionValue) : [...prev, optionValue];

          // Use the ref to escape the dependency array
          onValueChangeRef.current?.(next);
          return next;
        });

        if (closeOnSelect) setIsPopoverOpen(false);
      },
      [disabled, closeOnSelect],
    );

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
      if (focusedBadgeIndex > lastBadgeIndex) {
        setFocusedBadgeIndex(lastBadgeIndex);
      }
    }, [selectedValues.length, lastBadgeIndex, focusedBadgeIndex]);

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
              role="combobox"
              aria-expanded={isPopoverOpen}
              aria-haspopup="listbox"
              aria-controls={isPopoverOpen ? listboxId : undefined}
              aria-describedby={`${triggerDescriptionId} ${selectedCountId}`}
              aria-label={`Multi-select: ${selectedValues.length} of ${
                selectionList.length
              } options selected. ${placeholder}`}
              className={cn(
                buttonVariants({ variant: "combobox" }),
                "flex p-1 rounded-md border min-h-10 h-auto items-center justify-between bg-inherit hover:bg-inherit", // [&_svg]:pointer-events-auto

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
                      compactMode={compactMode}
                      disabled={disabled}
                    />
                  ))}
                  <div data-shadow-plus>
                    <GhostBadge
                      label={`+ ${selectedValues.length} more`}
                      compactMode={compactMode}
                      disabled={disabled}
                    />
                  </div>
                </div>
                <div ref={containerRef} className="flex justify-between items-center w-full">
                  {/* 1. Selected Options Area */}
                  <div
                    className={cn(
                      "flex items-center gap-2 p-1 overflow-hidden",
                      singleLine ? "overflow-x-auto multiselect-singleline-scroll" : "flex-wrap",
                      compactMode && "gap-0.5",
                    )}
                  >
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
                          />
                        ))}
                        {selectedValues.length > visibleCount && (
                          <MultiSelectBadge
                            isFocused={focusedBadgeIndex === maxBadgeIndex}
                            isMaxCount
                            label={`+ ${selectedValues.length - visibleCount} more`}
                            onAction={(e) => {
                              e.stopPropagation();
                              clearExtraOptions();
                              setFocusedBadgeIndex(-1);
                            }}
                            disabled={disabled}
                            variant={variant}
                            singleLine={singleLine}
                            compactMode={compactMode}
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
                    {!disabled && selectedValues.length > 0 && (
                      <ClearButton
                        onClick={handleClear}
                        totalSelected={selectedValues.length}
                        isFocused={focusedBadgeIndex === clearButtonIndex}
                      />
                    )}
                    {!disabled && <Separator orientation="vertical" className="flex min-h-6 h-full mx-1" />}
                    {!disabled && (
                      <ChevronDown className="h-4 mx-2 pointer-events-none text-muted-foreground opacity-50" />
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

                {/* Select All Section */}
                {!hideSelectAll && !searchValue && (
                  <CommandGroup>
                    <CommandItem onSelect={toggleAll} className="cursor-pointer">
                      <div
                        className={cn(
                          "mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary",
                          selectedValues.length === selectionList.filter((o) => !o.disabled).length
                            ? "bg-primary text-primary-foreground"
                            : "opacity-50 [&_svg]:invisible",
                        )}
                      >
                        <CheckIcon className="h-4 w-4" />
                      </div>
                      <span>(Select All {selectionList.length > 20 && `- ${selectionList.length} options`})</span>
                    </CommandItem>
                  </CommandGroup>
                )}

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
                showSelected={selectedValues.length > 0}
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

    hideIcons = false,
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
    hideIcons?: boolean;
    compactMode: boolean;
    singleLine: boolean;
    onAction: (event: React.MouseEvent<SVGSVGElement, MouseEvent>) => void;
  }) {
    const customStyle = option?.style;
    const IconComponent = option?.icon;

    return (
      <Badge
        aria-readonly={disabled}
        className={cn(
          multiSelectVariants({ variant }),
          "[&>svg]:pointer-events-auto aria-readonly:cursor-auto",
          compactMode && "text-xs px-1.5 py-0.5",
          singleLine && "shrink-0 whitespace-nowrap",

          customStyle?.gradient && "text-white border-transparent",
          "transition-all duration-75",
          isFocused && "ring-2 ring-ring ring-offset-1 ",
        )}
        style={
          !isMaxCount
            ? {
                backgroundColor: customStyle?.badgeColor,
                background: customStyle?.gradient,
                color: customStyle?.gradient ? "white" : undefined,
              }
            : {}
        }
      >
        {!isMaxCount && IconComponent && !hideIcons && (
          <span
            className={cn("flex items-center justify-center mr-2 shrink-0", compactMode ? "h-3 w-3 mr-1" : "h-4 w-4")}
            style={customStyle?.iconColor ? { color: customStyle.iconColor } : {}}
          >
            <IconComponent className="h-full w-full" />
          </span>
        )}

        {!disabled && (
          <XCircle
            role="button"
            className={cn("h-3 w-3 cursor-pointer opacity-70 hover:opacity-100 mr-1")}
            onClick={(e) => {
              //e.stopPropagation();
              onAction(e);
            }}
          />
        )}

        <span className={cn("truncate")}>{isMaxCount ? label : option?.label}</span>
      </Badge>
    );
  },
  (prev, next) => {
    return (
      prev.option?.value === next.option?.value &&
      prev.isFocused === next.isFocused &&
      prev.label === next.label &&
      prev.disabled === next.disabled &&
      prev.onAction === next.onAction
    );
  },
);

const GhostBadge = ({ label, compactMode, disabled }: { label: string; compactMode: boolean; disabled: boolean }) => (
  <div
    className={cn(
      badgeVariants({ variant: "default" }),
      multiSelectVariants({ variant: "default" }),
      "flex items-center whitespace-nowrap rounded-md border font-semibold", // Match standard Badge base
      compactMode && "text-xs px-1.5 py-0.5",
    )}
    aria-hidden="true"
  >
    {!disabled && <div className="mr-1 h-4 w-4 shrink-0" />}
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
            "mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary",
            isSelected ? "bg-primary text-primary-foreground" : "opacity-50 [&_svg]:invisible",
          )}
          aria-hidden="true"
        >
          <CheckIcon className="h-4 w-4" />
        </div>
        {option.icon && <option.icon className="mr-2 h-4 w-4 text-muted-foreground" aria-hidden="true" />}
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
  showSelected,
}: {
  onClear: () => void;
  onClose: () => void;
  showClear: boolean;
  showSelected: boolean;
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
    {showSelected && (
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

function useOverflowDetection(itemsCount: number) {
  const GAP_SIZE = 8;
  const MINIMUM_BADGE_WIDTH = 62;

  const containerRef = React.useRef<HTMLDivElement>(null);
  const shadowRef = React.useRef<HTMLDivElement>(null);
  const actionsRef = React.useRef<HTMLDivElement>(null);

  const [visibleCount, setVisibleCount] = React.useState(itemsCount);
  const [measurementLimit, setMeasurementLimit] = React.useState(10);

  const calculateBadgeBounds = React.useCallback(() => {
    const container = containerRef.current;
    const shadow = shadowRef.current;
    const actions = actionsRef.current;
    if (!container || !shadow || !actions) return;

    const { width: actionAreaWidth } = actions.getBoundingClientRect();

    const { width: containerWidth } = container.getBoundingClientRect();
    const availableWidth = containerWidth - actionAreaWidth - 8;

    const estimatedMax = Math.ceil(availableWidth / MINIMUM_BADGE_WIDTH) + 2;
    setMeasurementLimit(estimatedMax);

    const shadowChildren = Array.from(shadow.children) as HTMLElement[];
    const maxCountBadge = shadowChildren.find((el) => el.hasAttribute("data-shadow-plus"));
    const BadgeList = shadowChildren.filter((el) => !el.hasAttribute("data-shadow-plus"));

    const maxCountBadgeWidth = maxCountBadge ? maxCountBadge.getBoundingClientRect().width + 4 : MINIMUM_BADGE_WIDTH;
    //723
    let currentWidth = 0;
    let fitCount = 0;

    for (let i = 0; i < BadgeList.length; i++) {
      const childWidth = BadgeList[i].getBoundingClientRect().width + 4;
      const spaceNeeded = childWidth + GAP_SIZE;
      if (currentWidth + spaceNeeded + maxCountBadgeWidth > availableWidth) break;
      currentWidth += childWidth;
      fitCount++;
    }

    const totalBadgesWidth = BadgeList.reduce((acc, el) => acc + el.getBoundingClientRect().width, 0);
    const totalGapsWidth = Math.max(0, BadgeList.length - 1) * GAP_SIZE;
    const totalNeeded = totalBadgesWidth + totalGapsWidth;

    if (totalNeeded < availableWidth && itemsCount <= BadgeList.length) {
      setVisibleCount(itemsCount);
    } else {
      setVisibleCount(Math.max(0, fitCount));
    }
  }, [itemsCount]);

  React.useLayoutEffect(() => {
    calculateBadgeBounds();
  }, [itemsCount, calculateBadgeBounds]);

  React.useLayoutEffect(() => {
    if (!containerRef.current || !actionsRef.current) return;

    const observer = new ResizeObserver(() => {
      window.requestAnimationFrame(calculateBadgeBounds);
    });

    observer.observe(containerRef.current);
    observer.observe(actionsRef.current);

    return () => observer.disconnect();
  }, [calculateBadgeBounds]);

  return { containerRef, shadowRef, actionsRef, visibleCount, measurementLimit };
}

function useMultiSelectAnnouncements({
  selectedValues,
  isPopoverOpen,
  searchValue,
  selectionList,
  announce,
}: {
  selectedValues: string[];
  isPopoverOpen: boolean;
  searchValue: string;
  selectionList: MultiSelectOption[];
  announce: (message: string, priority?: "polite" | "assertive") => void;
}) {
  const prevSelectedCount = React.useRef(selectedValues.length);
  const prevIsOpen = React.useRef(isPopoverOpen);
  const prevSearchValue = React.useRef(searchValue);

  React.useEffect(() => {
    const selectedCount = selectedValues.length;
    const totalOptions = selectionList.filter((opt) => !opt.disabled).length;

    // 1. Handle Selection Changes
    if (selectedCount !== prevSelectedCount.current) {
      const diff = selectedCount - prevSelectedCount.current;

      if (diff > 0) {
        const addedItems = selectedValues.slice(-diff);
        const addedLabels = addedItems
          .map((val) => selectionList.find((opt) => opt.value === val)?.label)
          .filter(Boolean);

        if (addedLabels.length === 1) {
          announce(`${addedLabels[0]} selected. ${selectedCount} of ${totalOptions} options selected.`);
        } else {
          announce(`${addedLabels.length} options selected. ${selectedCount} of ${totalOptions} selected.`);
        }
      } else if (diff < 0) {
        announce(`Option removed. ${selectedCount} of ${totalOptions} options selected.`);
      }
      prevSelectedCount.current = selectedCount;
    }

    // 2. Handle Popover State
    if (isPopoverOpen !== prevIsOpen.current) {
      if (isPopoverOpen) {
        announce(`Dropdown opened. ${totalOptions} options available. Use arrow keys to navigate.`);
      } else {
        announce("Dropdown closed.");
      }
      prevIsOpen.current = isPopoverOpen;
    }

    // 3. Handle Search Results
    if (searchValue !== prevSearchValue.current && searchValue !== undefined) {
      if (searchValue && isPopoverOpen) {
        const filteredCount = selectionList.filter(
          (opt) =>
            opt.label.toLowerCase().includes(searchValue.toLowerCase()) ||
            opt.value.toLowerCase().includes(searchValue.toLowerCase()),
        ).length;

        announce(`${filteredCount} option${filteredCount === 1 ? "" : "s"} found for "${searchValue}"`);
      }
      prevSearchValue.current = searchValue;
    }
  }, [selectedValues, isPopoverOpen, searchValue, announce, selectionList]);
}

interface UseMultiSelectKeyboardProps {
  disabled: boolean;
  isPopoverOpen: boolean;
  searchValue: string;
  selectedValues: string[];
  focusedBadgeIndex: number;
  setFocusedBadgeIndex: (index: number) => void;
  lastBadgeIndex: number;
  clearButtonIndex: number;
  maxBadgeIndex: number;
  toggleOption: (value: string) => void;
  handleClear: () => void;
  clearExtraOptions: () => void;
  setIsPopoverOpen: (open: boolean) => void;
}

export function useMultiSelectKeyboard({
  disabled,
  isPopoverOpen,
  searchValue,
  selectedValues,
  focusedBadgeIndex,
  setFocusedBadgeIndex,
  lastBadgeIndex,
  clearButtonIndex,
  maxBadgeIndex,
  toggleOption,
  handleClear,
  clearExtraOptions,
  setIsPopoverOpen,
}: UseMultiSelectKeyboardProps) {
  const handleKeyDown = React.useCallback(
    (event: React.KeyboardEvent<HTMLInputElement>) => {
      if (disabled || isPopoverOpen) return;

      switch (event.key) {
        case "ArrowLeft":
          if (focusedBadgeIndex === -1 && lastBadgeIndex >= 0) {
            setFocusedBadgeIndex(lastBadgeIndex);
          } else if (focusedBadgeIndex > 0) {
            setFocusedBadgeIndex(focusedBadgeIndex - 1);
          }
          break;

        case "ArrowRight":
          if (focusedBadgeIndex !== -1) {
            if (focusedBadgeIndex < lastBadgeIndex) {
              setFocusedBadgeIndex(focusedBadgeIndex + 1);
            } else {
              setFocusedBadgeIndex(-1);
            }
          }
          break;

        case "Backspace":
        case "Delete":
          if (focusedBadgeIndex !== -1) {
            event.preventDefault();
            if (focusedBadgeIndex === clearButtonIndex) {
              handleClear();
              setFocusedBadgeIndex(-1);
            } else if (focusedBadgeIndex === maxBadgeIndex) {
              clearExtraOptions();
              setFocusedBadgeIndex(-1);
            } else {
              toggleOption(selectedValues[focusedBadgeIndex]);
              // Move focus to the previous item or back to input
              setFocusedBadgeIndex(Math.max(-1, focusedBadgeIndex - 1));
            }
          } else if (searchValue === "" && selectedValues.length > 0) {
            // Quick delete the last item when typing
            toggleOption(selectedValues[selectedValues.length - 1]);
          }
          break;

        case "Enter":
        case " ":
          if (focusedBadgeIndex !== -1) {
            event.preventDefault();
            if (focusedBadgeIndex === clearButtonIndex) {
              handleClear();
              setFocusedBadgeIndex(-1);
            } else if (focusedBadgeIndex === maxBadgeIndex) {
              clearExtraOptions();
              setFocusedBadgeIndex(-1);
            } else {
              toggleOption(selectedValues[focusedBadgeIndex]);
            }
          } else {
            setIsPopoverOpen(true);
          }
          break;

        case "Escape":
          if (focusedBadgeIndex !== -1) {
            event.preventDefault();
            event.stopPropagation();
            setFocusedBadgeIndex(-1);
          }
          break;
      }
    },
    [
      disabled,
      isPopoverOpen,
      focusedBadgeIndex,
      lastBadgeIndex,
      clearButtonIndex,
      maxBadgeIndex,
      selectedValues,
      searchValue,
      setFocusedBadgeIndex,
      toggleOption,
      handleClear,
      clearExtraOptions,
      setIsPopoverOpen,
    ],
  );

  return { handleKeyDown };
}

MultiSelect.displayName = "MultiSelect";
export type { MultiSelectOption, MultiSelectGroup, MultiSelectProps };
