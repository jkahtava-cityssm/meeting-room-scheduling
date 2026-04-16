import React from 'react';
import { MultiSelectOption } from './multi-select';

export function useMultiSelectAnnouncements({
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
  announce: (message: string, priority?: 'polite' | 'assertive') => void;
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
        const addedLabels = addedItems.map((val) => selectionList.find((opt) => opt.value === val)?.label).filter(Boolean);

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
        announce('Dropdown closed.');
      }
      prevIsOpen.current = isPopoverOpen;
    }

    // 3. Handle Search Results
    if (searchValue !== prevSearchValue.current && searchValue !== undefined) {
      if (searchValue && isPopoverOpen) {
        const filteredCount = selectionList.filter(
          (opt) => opt.label.toLowerCase().includes(searchValue.toLowerCase()) || opt.value.toLowerCase().includes(searchValue.toLowerCase()),
        ).length;

        announce(`${filteredCount} option${filteredCount === 1 ? '' : 's'} found for "${searchValue}"`);
      }
      prevSearchValue.current = searchValue;
    }
  }, [selectedValues, isPopoverOpen, searchValue, announce, selectionList]);
}
