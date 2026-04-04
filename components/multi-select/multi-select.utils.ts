import { type MultiSelectOption, type MultiSelectGroup, type NavigationIndices } from './multi-select.types';

/**
 * Check if options array contains groups
 */
export const isGroupedOptions = (opts: MultiSelectOption[] | MultiSelectGroup[]): opts is MultiSelectGroup[] => {
  return opts.length > 0 && 'heading' in opts[0];
};

/**
 * Compare two string arrays for equality
 */
export const arraysEqual = (a: string[], b: string[]): boolean => {
  if (a.length !== b.length) return false;
  const sortedA = [...a].sort();
  const sortedB = [...b].sort();
  return sortedA.every((val, index) => val === sortedB[index]);
};

/**
 * Build flat list of all options from grouped or ungrouped options
 */
export const buildSelectionList = (options: MultiSelectOption[] | MultiSelectGroup[], deduplicateOptions: boolean): MultiSelectOption[] => {
  if (options.length === 0) return [];

  const allOptions = isGroupedOptions(options) ? options.flatMap((group) => group.options) : options;

  if (!deduplicateOptions) return allOptions;

  const seen = new Set<string>();
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

  if (process.env.NODE_ENV === 'development' && duplicates.length > 0) {
    const action = deduplicateOptions ? 'automatically removed' : 'detected';
    console.warn(
      `MultiSelect: Duplicate option values ${action}: ${duplicates.join(', ')}. ` +
        `${
          deduplicateOptions
            ? 'Duplicates have been removed automatically.'
            : "This may cause unexpected behavior. Consider setting 'deduplicateOptions={true}' or ensure all option values are unique."
        }`,
    );
  }
  return unique;
};

/**
 * Filter options based on search value
 */
export const filterOptions = (
  options: MultiSelectOption[] | MultiSelectGroup[],
  searchValue: string,
  isGrouped: boolean,
): MultiSelectOption[] | MultiSelectGroup[] => {
  if (!searchValue) return options;
  if (options.length === 0) return [];

  if (isGrouped) {
    return (options as MultiSelectGroup[])
      .map((group) => ({
        ...group,
        options: group.options.filter(
          (option) =>
            option.label.toLowerCase().includes(searchValue.toLowerCase()) || option.value.toLowerCase().includes(searchValue.toLowerCase()),
        ),
      }))
      .filter((group) => group.options.length > 0);
  }

  return (options as MultiSelectOption[]).filter(
    (option) => option.label.toLowerCase().includes(searchValue.toLowerCase()) || option.value.toLowerCase().includes(searchValue.toLowerCase()),
  );
};

/**
 * Calculate navigation indices for keyboard navigation
 */
export const getNavigationIndices = (count: number, maxVisible: number, isDisabled: boolean): NavigationIndices => {
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

/**
 * Create a map of option values to options for quick lookup
 */
export const createOptionsMap = (options: MultiSelectOption[]): Map<string, MultiSelectOption> => {
  return new Map(options.map((opt) => [opt.value, opt]));
};

/**
 * Get option by value from map, with optional dev warning
 */
export const getOptionByValue = (value: string, optionsMap: Map<string, MultiSelectOption>): MultiSelectOption | undefined => {
  const option = optionsMap.get(value);
  if (!option && process.env.NODE_ENV === 'development') {
    console.warn(`MultiSelect: Option with value "${value}" not found in options list`);
  }
  return option;
};
