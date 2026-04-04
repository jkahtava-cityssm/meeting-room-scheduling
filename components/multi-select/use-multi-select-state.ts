import React from 'react';
import { arraysEqual } from './multi-select.utils';

/**
 * Core state management hook for MultiSelect component
 */
export function useMultiSelectState(
  defaultValue: string[],
  onValueChange: (value: string[]) => void,
  resetOnDefaultValueChange: boolean,
  closeOnSelect: boolean,
) {
  const [selectedValues, setSelectedValues] = React.useState<string[]>(defaultValue);
  const [isPopoverOpen, setIsPopoverOpen] = React.useState(false);
  const [searchValue, setSearchValue] = React.useState('');
  const [focusedBadgeIndex, setFocusedBadgeIndex] = React.useState<number>(-1);
  const [politeMessage, setPoliteMessage] = React.useState('');
  const [assertiveMessage, setAssertiveMessage] = React.useState('');

  const prevDefaultValueRef = React.useRef<string[]>(defaultValue);
  const onValueChangeRef = React.useRef(onValueChange);
  const timeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  // Keep ref updated with latest onValueChange
  React.useLayoutEffect(() => {
    onValueChangeRef.current = onValueChange;
  }, [onValueChange]);

  // Sync state to onValueChange callback
  React.useEffect(() => {
    onValueChangeRef.current?.(selectedValues);
  }, [selectedValues]);

  // Reset focus when popover opens/closes
  React.useEffect(() => {
    setFocusedBadgeIndex(-1);
  }, [isPopoverOpen]);

  // Handle defaultValue changes
  React.useEffect(() => {
    if (!resetOnDefaultValueChange) return;
    const prevDefaultValue = prevDefaultValueRef.current;
    if (!arraysEqual(prevDefaultValue, defaultValue)) {
      if (!arraysEqual(selectedValues, defaultValue)) {
        setSelectedValues(defaultValue);
      }
      prevDefaultValueRef.current = [...defaultValue];
    }
  }, [defaultValue, selectedValues, resetOnDefaultValueChange]);

  // Clear focused badge when no selections
  React.useEffect(() => {
    if (selectedValues.length === 0 && focusedBadgeIndex !== -1) {
      setFocusedBadgeIndex(-1);
    }
  }, [selectedValues.length, focusedBadgeIndex]);

  const announce = React.useCallback((message: string, priority: 'polite' | 'assertive' = 'polite') => {
    const setMessage = priority === 'assertive' ? setAssertiveMessage : setPoliteMessage;

    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setMessage(message);

    timeoutRef.current = setTimeout(() => {
      setMessage('');
    }, 500);
  }, []);

  const toggleOption = React.useCallback(
    (optionValue: string) => {
      setSelectedValues((prev) => (prev.includes(optionValue) ? prev.filter((v) => v !== optionValue) : [...prev, optionValue]));
      if (closeOnSelect) setIsPopoverOpen(false);
    },
    [closeOnSelect],
  );

  const handleClear = React.useCallback(() => {
    setSelectedValues([]);
    onValueChange([]);
  }, [onValueChange]);

  const resetToDefault = React.useCallback(() => {
    setSelectedValues(defaultValue);
    setIsPopoverOpen(false);
    setSearchValue('');
    onValueChange(defaultValue);
  }, [defaultValue, onValueChange]);

  const handleTogglePopover = (value: boolean) => {
    if (value) {
      setSearchValue('');
    }
    setIsPopoverOpen(value);
  };

  return {
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
  };
}
