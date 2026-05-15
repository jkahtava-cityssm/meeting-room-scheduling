import * as React from 'react';

import { cn } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';
import { buttonVariants } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandList } from '@/components/ui/command';

// Extracted utilities and components
import { type MultiSelectOption, type MultiSelectGroup, type MultiSelectProps, type MultiSelectRef } from './multi-select.types';
import { isGroupedOptions, buildSelectionList, filterOptions, getNavigationIndices, createOptionsMap, getOptionByValue } from './multi-select.utils';
import { useMultiSelectState } from './use-multi-select-state';
import { useMultiSelectAnnouncements } from './use-multi-select-announcements';
import { useMultiSelectKeyboard } from './use-multi-select-keyboard';
import { useOverflowDetection } from './use-overflow-detection';
import { MultiSelectBadge } from './multi-select-badge';
import { GhostBadge, BadgePlaceholder } from './badge-placeholder';
import { ClearButton, ChevronButton } from './multi-select-buttons';
import { OptionItem } from './option-item';
import { CommandFooter } from './command-footer';

/**
 * MultiSelect Component
 *
 * A flexible, accessible dropdown component for selecting multiple items with features like:
 * - Search functionality
 * - Grouped options
 * - Keyboard navigation
 * - Customizable variants and styling
 * - Accessibility (ARIA labels, keyboard support, screen reader announcements)
 */

export const MultiSelect = React.forwardRef<MultiSelectRef, MultiSelectProps>(
  (
    {
      options,
      onValueChange,
      variant,
      defaultValue = [],
      placeholder = 'Select options',
      placeholderBadge,
      searchText = 'Search options...',
      noResultText = 'No results found.',
      hideIcon = false,
      hideMoreLabel: hideMoreBadge = true,
      showSelectedButton = false,
      hideClearAll = false,
      hideClearSingle = false,
      compactMode = false,
      modalPopover = false,
      className,
      hideSelectAllIcon = false,
      hideSelectAll = false,
      searchable = true,
      emptyIndicator,
      singleLine = true,
      popoverClassName,
      disabled = false,
      deduplicateOptions = false,
      resetOnDefaultValueChange = true,
      closeOnSelect = false,
      selectAllBadge,
      overflowLabel = 'Items Selected',
      ...props
    },
    ref,
  ) => {
    // Core state management
    const {
      selectedValues,
      setSelectedValues,
      isPopoverOpen,
      setIsPopoverOpen,
      searchValue,
      setSearchValue,
      focusedBadgeIndex,
      setFocusedBadgeIndex,
      politeMessage,
      assertiveMessage,
      announce,
      toggleOption,
      handleClear,
      resetToDefault,
      handleTogglePopover,
    } = useMultiSelectState(defaultValue, onValueChange, resetOnDefaultValueChange, closeOnSelect);

    // Overflow detection for badge display
    const { containerRef, actionsRef, shadowRef, measurementLimit, visibleIndices } = useOverflowDetection(selectedValues);

    // Generate unique IDs for accessibility
    const multiSelectId = React.useId();
    const listboxId = `${multiSelectId}-listbox`;
    const triggerDescriptionId = `${multiSelectId}-description`;
    const selectedCountId = `${multiSelectId}-count`;

    // Build flat list of all available options
    const selectionList = React.useMemo(() => buildSelectionList(options, deduplicateOptions), [options, deduplicateOptions]);

    // Create options map for quick lookup
    const optionsMap = React.useMemo(() => createOptionsMap(selectionList), [selectionList]);

    // Helper to get option by value
    const getOption = React.useCallback((value: string) => getOptionByValue(value, optionsMap), [optionsMap]);

    // Filter options based on search
    const filteredOptions = React.useMemo(
      () => filterOptions(options, searchable && searchValue ? searchValue : '', isGroupedOptions(options)),
      [options, searchValue, searchable],
    );

    // Calculate navigation indices for keyboard navigation
    const { maxBadgeIndex, clearButtonIndex, lastBadgeIndex, chevronIndex } = React.useMemo(
      () => getNavigationIndices(selectedValues.length, visibleIndices.length, disabled),
      [selectedValues.length, visibleIndices.length, disabled],
    );

    // Compute UI visibility states
    const visibility = React.useMemo(
      () => ({
        showSelectAllBadge: !hideSelectAll && selectedValues.length === selectionList.length && !!selectAllBadge,
        showMoreBadge: selectedValues.length > visibleIndices.length && !hideMoreBadge,
        showCountBadge: selectedValues.length > visibleIndices.length && hideMoreBadge && visibleIndices.length > 0,
        showOverflowPlaceholder: selectedValues.length > 0 && visibleIndices.length === 0 && hideMoreBadge,
        showPlaceholder: selectedValues.length === 0,
        showClearButton: !disabled && selectedValues.length > 0 && !hideClearAll,
        showSeparators: !disabled,
        showChevron: !disabled,
        showSelectAllOption: !hideSelectAll && !searchValue,
      }),
      [
        disabled,
        hideSelectAll,
        hideClearAll,
        hideMoreBadge,
        selectedValues.length,
        visibleIndices.length,
        searchValue,
        selectAllBadge,
        selectionList.length,
      ],
    );

    // Ref for button element
    const buttonRef = React.useRef<HTMLDivElement>(null);

    // Expose imperative API
    React.useImperativeHandle(
      ref,
      () => ({
        reset: resetToDefault,
        getSelectedValues: () => selectedValues,
        setSelectedValues: (values: string[]) => {
          setSelectedValues(values);
          onValueChange(values);
        },
        clear: () => {
          handleClear();
          announce('All items cleared', 'assertive');
        },
        focus: () => buttonRef.current?.focus(),
      }),
      [resetToDefault, selectedValues, setSelectedValues, onValueChange, handleClear, announce],
    );

    // Keyboard navigation
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
      handleClear: () => {
        handleClear();
        announce('All items cleared', 'assertive');
      },
      clearExtraOptions: () => {
        const newSelectedValues = selectedValues.filter((_, index) => visibleIndices.includes(index));
        setSelectedValues(newSelectedValues);
        onValueChange(newSelectedValues);
      },
      setIsPopoverOpen,
    });

    // Accessibility announcements hook
    useMultiSelectAnnouncements({
      selectedValues,
      isPopoverOpen,
      searchValue,
      selectionList,
      announce,
    });

    // Toggle all options
    const toggleAll = React.useCallback(() => {
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
    }, [disabled, selectionList, selectedValues.length, handleClear, setSelectedValues, onValueChange, closeOnSelect, setIsPopoverOpen]);

    return (
      <>
        {/* Accessibility announcements */}
        <div className="sr-only">
          <div aria-live="polite" aria-atomic="true" role="status">
            {politeMessage}
          </div>
          <div aria-live="assertive" aria-atomic="true" role="alert">
            {assertiveMessage}
          </div>
        </div>

        {/* Main popover */}
        <Popover open={isPopoverOpen} onOpenChange={handleTogglePopover} modal={modalPopover}>
          {/* Accessibility descriptions */}
          <div id={triggerDescriptionId} className="sr-only">
            Multi-select dropdown. Use arrow keys to navigate, Enter to select, and Escape to close.
          </div>
          <div id={selectedCountId} className="sr-only" aria-live="polite">
            {selectedValues.length === 0
              ? 'No options selected'
              : `${selectedValues.length} option${selectedValues.length === 1 ? '' : 's'} selected: ${selectedValues
                  .map((value) => getOption(value)?.label)
                  .filter(Boolean)
                  .join(', ')}`}
          </div>

          {/* Trigger button */}
          <PopoverTrigger asChild>
            <div
              ref={buttonRef}
              tabIndex={disabled ? -1 : 0}
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
                buttonVariants({ variant: 'combobox' }),
                'flex p-1 rounded-md border h-9  items-center justify-between bg-inherit hover:bg-inherit',
                disabled && 'opacity-50 cursor-not-allowed',
                className,
              )}
            >
              <div className="relative w-full">
                <div
                  ref={shadowRef}
                  className="flex items-center gap-2 p-1 absolute opacity-0 pointer-events-none whitespace-nowrap"
                  style={{ visibility: 'hidden', left: 0, top: 0, zIndex: -1 }}
                  aria-hidden="true"
                >
                  {selectedValues.slice(0, measurementLimit).map((value) => (
                    <GhostBadge
                      key={`shadow-${value}`}
                      label={getOption(value)?.label ?? ''}
                      hasIcon={(getOption(value)?.icon !== undefined && getOption(value)?.color !== undefined) ?? false}
                      compactMode={compactMode}
                      disabled={disabled}
                      hideClearSingle={hideClearSingle}
                      hideIcon={hideIcon}
                    />
                  ))}
                  {visibility.showMoreBadge ? (
                    <div data-shadow-plus>
                      <GhostBadge
                        label={`+ ${selectedValues.length - visibleIndices.length} more`}
                        hasIcon={false}
                        compactMode={compactMode}
                        disabled={disabled}
                        hideClearSingle={hideClearSingle}
                        hideIcon={hideIcon}
                      />
                    </div>
                  ) : (
                    <div
                      data-shadow-plus
                      className={cn('px-2 py-1 rounded-md bg-accent text-accent-foreground text-xs font-mono font-medium whitespace-nowrap')}
                    >
                      + {selectedValues.length}
                    </div>
                  )}
                </div>

                {/* Main content container */}
                <div ref={containerRef} className="flex justify-between items-center w-full">
                  {/* Selected badges area */}
                  <div className={cn('flex flex-1 items-center gap-2 p-1 overflow-hidden', compactMode && 'gap-0.5')}>
                    {visibility.showPlaceholder ? (
                      <BadgePlaceholder placeholderBadge={placeholderBadge} variant={variant} placeholder={placeholder} compactMode={compactMode} />
                    ) : visibility.showOverflowPlaceholder ? (
                      <BadgePlaceholder
                        placeholderBadge={{
                          label: `${selectedValues.length} ${overflowLabel}`,
                        }}
                        variant={variant}
                        placeholder=""
                        compactMode={compactMode}
                      />
                    ) : (
                      <>
                        {visibility.showSelectAllBadge ? (
                          <MultiSelectBadge
                            key={'-1'}
                            isFocused={focusedBadgeIndex === 0}
                            option={selectAllBadge}
                            onAction={(e) => {
                              e.stopPropagation();
                              const newValues = selectedValues.filter((_, index) => visibleIndices.includes(index));
                              setSelectedValues(newValues);
                              onValueChange(newValues);
                              setFocusedBadgeIndex(-1);
                            }}
                            disabled={disabled}
                            variant={variant}
                            singleLine={singleLine}
                            compactMode={compactMode}
                            hideClearSingle={hideClearSingle}
                            hideIcon={hideIcon}
                          />
                        ) : (
                          selectedValues.map((value, index) => {
                            if (!visibleIndices.includes(index)) return null;
                            return (
                              <MultiSelectBadge
                                key={value}
                                isFocused={focusedBadgeIndex === index}
                                option={getOption(value)}
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
                            );
                          })
                        )}
                        {visibility.showMoreBadge && (
                          <MultiSelectBadge
                            isFocused={focusedBadgeIndex === maxBadgeIndex}
                            isMaxCount
                            label={`+ ${selectedValues.length - visibleIndices.length} more`}
                            onAction={(e) => {
                              e.stopPropagation();
                              const newValues = selectedValues.filter((_, index) => visibleIndices.includes(index));
                              setSelectedValues(newValues);
                              onValueChange(newValues);
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
                    )}
                    {visibility.showCountBadge && (
                      <div
                        className={cn(
                          'px-2 py-1 rounded-md bg-accent text-accent-foreground text-xs font-mono font-medium whitespace-nowrap ml-auto',
                        )}
                      >
                        +{visibility.showSelectAllBadge ? selectedValues.length : selectedValues.length - visibleIndices.length}
                      </div>
                    )}
                  </div>

                  {/* Action buttons area */}
                  <div ref={actionsRef} className="flex items-center">
                    {visibility.showClearButton && (
                      <ClearButton
                        onClick={() => {
                          handleClear();
                          announce('All items cleared', 'assertive');
                        }}
                        totalSelected={selectedValues.length}
                        isFocused={focusedBadgeIndex === clearButtonIndex}
                      />
                    )}
                    {visibility.showSeparators && <Separator orientation="vertical" className="flex min-h-6 h-full mx-1" />}
                    {visibility.showChevron && (
                      <ChevronButton onClick={() => setIsPopoverOpen(true)} isFocused={focusedBadgeIndex === chevronIndex} />
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
            className={cn('w-full min-w-(--radix-popover-trigger-width) p-0', 'touch-manipulation', popoverClassName)}
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

              <CommandList className={cn('max-h-[300px] overflow-y-auto multiselect-scrollbar', 'overscroll-behavior-y-contain')}>
                <CommandEmpty>{emptyIndicator || noResultText}</CommandEmpty>

                {isGroupedOptions(filteredOptions) ? (
                  // Grouped options
                  filteredOptions.map((group) => (
                    <CommandGroup key={group.heading} heading={group.heading}>
                      {group.options.map((opt) => (
                        <OptionItem key={opt.value} option={opt} isSelected={selectedValues.includes(opt.value)} onToggle={toggleOption} />
                      ))}
                    </CommandGroup>
                  ))
                ) : (
                  <CommandGroup>
                    {visibility.showSelectAllOption && (
                      <OptionItem
                        option={{
                          label: 'Select All',
                          value: '',
                          color: 'zinc',
                          disabled: false,
                          icon: 'asterisk',
                        }}
                        isSelected={selectedValues.length === selectionList.filter((o) => !o.disabled).length}
                        onToggle={toggleAll}
                      />
                    )}
                    {filteredOptions.map((opt) => (
                      <OptionItem key={opt.value} option={opt} isSelected={selectedValues.includes(opt.value)} onToggle={toggleOption} />
                    ))}
                  </CommandGroup>
                )}
              </CommandList>

              {/* Footer with action buttons */}
              <CommandFooter
                onClear={() => {
                  handleClear();
                  announce('All items cleared', 'assertive');
                }}
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

MultiSelect.displayName = 'MultiSelect';

// Re-export types and interfaces
export type { MultiSelectOption, MultiSelectGroup, MultiSelectProps, MultiSelectRef };
