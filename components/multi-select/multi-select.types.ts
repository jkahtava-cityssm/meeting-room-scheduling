import { cva, type VariantProps } from 'class-variance-authority';
import { IconName } from '../ui/icon-dynamic';
import { TColors } from '@/lib/types';

/**
 * Variants for the multi-select component to handle different styles.
 * Uses class-variance-authority (cva) to define different styles based on "variant" prop.
 */
export const multiSelectVariants = cva('transition-all duration-300 ease-in-out', {
  variants: {
    variant: {
      default: 'border-foreground/10 text-foreground bg-card hover:bg-card/80 shadow-md ring-1 ring-white/10',
      secondary: 'border-foreground/10 bg-secondary text-secondary-foreground hover:bg-secondary/80 shadow-md ring-1 ring-white/10',
      destructive: 'border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80 shadow-md ring-1 ring-white/10',
      inverted: 'inverted',
    },
  },
  defaultVariants: {
    variant: 'default',
  },
});

export type MultiSelectVariantProps = VariantProps<typeof multiSelectVariants>;

/**
 * Option interface for MultiSelect component
 */
export interface MultiSelectOption {
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
export interface MultiSelectGroup {
  /** Group heading */
  heading: string;
  /** Options in this group */
  options: MultiSelectOption[];
}

/**
 * Props for MultiSelect component
 */
export interface MultiSelectProps extends VariantProps<typeof multiSelectVariants> {
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

  /**
   * Custom label for the overflow badge shown when no items can fit in the display.
   * e.g., "Rooms Selected", "Items Selected", "Users Selected"
   * Optional, defaults to "Items".
   */
  overflowLabel?: string;

  selectAllBadge?: MultiSelectOption;
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

/**
 * Navigation indices for keyboard navigation
 */
export interface NavigationIndices {
  maxBadgeIndex: number;
  clearButtonIndex: number;
  lastBadgeIndex: number;
  chevronIndex: number;
}
