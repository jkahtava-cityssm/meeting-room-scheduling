import React from 'react';

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
  chevronIndex: number;
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
  chevronIndex,
  toggleOption,
  handleClear,
  clearExtraOptions,
  setIsPopoverOpen,
}: UseMultiSelectKeyboardProps) {
  const handleKeyDown = React.useCallback(
    (event: React.KeyboardEvent<HTMLInputElement>) => {
      if (disabled || isPopoverOpen) return;

      const hasItems = selectedValues.length > 0;

      switch (event.key) {
        case 'ArrowLeft':
          if (!hasItems) return;
          if (chevronIndex === -1) return;

          if (focusedBadgeIndex === 0) {
            // Exit left, Back to the main container
            setFocusedBadgeIndex(-1);
          } else if (focusedBadgeIndex === -1) {
            // Enter from the right side
            setFocusedBadgeIndex(chevronIndex);
          } else {
            setFocusedBadgeIndex(focusedBadgeIndex - 1);
          }
          break;

        case 'ArrowRight':
          if (!hasItems) return;
          if (chevronIndex === -1) return;
          if (focusedBadgeIndex === chevronIndex) {
            // Exit right, Back to the main container
            setFocusedBadgeIndex(-1);
          } else if (focusedBadgeIndex === -1) {
            // Enter from the left side
            setFocusedBadgeIndex(0);
          } else {
            setFocusedBadgeIndex(focusedBadgeIndex + 1);
          }
          break;

        case 'Backspace':
        case 'Delete':
          if (focusedBadgeIndex === clearButtonIndex) {
            //Is Clear All Button Clicked
            handleClear();
            //Reset Focus, as all Badges are removed
            setFocusedBadgeIndex(-1);
          } else {
            //Is Individual Badge Clicked
            const optionToToggle = selectedValues[focusedBadgeIndex];
            if (optionToToggle) {
              toggleOption(optionToToggle);
              const isLastChip = focusedBadgeIndex === selectedValues.length - 1;
              if (isLastChip) {
                setFocusedBadgeIndex(focusedBadgeIndex - 1);
              }
            }
          }
          break;

        case 'Enter':
        case ' ':
          if (focusedBadgeIndex === -1) {
            setIsPopoverOpen(true);
            break;
          }

          if (focusedBadgeIndex === clearButtonIndex) {
            //Is Clear All Button Clicked
            handleClear();
            //Reset Focus, as all Badges are removed
            setFocusedBadgeIndex(-1);
          } else if (focusedBadgeIndex === maxBadgeIndex) {
            //Is Max Badge Clicked
            clearExtraOptions();
            //Move to the left, if it exists
            const nextIndex = maxBadgeIndex > 0 ? maxBadgeIndex - 1 : -1;
            setFocusedBadgeIndex(nextIndex);
          } else if (focusedBadgeIndex === chevronIndex) {
            //Is Chevron Button Clicked
            setIsPopoverOpen(!isPopoverOpen);
          } else {
            //Is Individual Badge Clicked
            const optionToToggle = selectedValues[focusedBadgeIndex];
            if (optionToToggle) {
              toggleOption(optionToToggle);
              const isLastChip = focusedBadgeIndex === selectedValues.length - 1;
              if (isLastChip) {
                setFocusedBadgeIndex(focusedBadgeIndex - 1);
              }
            }
          }

          break;

        case 'Escape':
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
      selectedValues,
      setFocusedBadgeIndex,
      chevronIndex,
      clearButtonIndex,
      maxBadgeIndex,
      handleClear,
      clearExtraOptions,
      toggleOption,
      setIsPopoverOpen,
    ],
  );

  return { handleKeyDown };
}
