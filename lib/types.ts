export type TCalendarView = "day" | "week" | "month" | "year" | "agenda";
export type TColors =
  | "red"
  | "orange"
  | "amber"
  | "yellow"
  | "lime"
  | "green"
  | "emerald"
  | "teal"
  | "cyan"
  | "sky"
  | "blue"
  | "indigo"
  | "violet"
  | "purple"
  | "fuchsia"
  | "pink"
  | "rose"
  | "slate"
  | "gray"
  | "zinc"
  | "neutral"
  | "stone";
export type TWorkingHours = { [key: number]: { from: number; to: number } };
export type TVisibleHours = { from: number; to: number };

export type TRecurrenceType = "Between" | "Occurrences" | "Forever";
export type TRecurrencePeriod = "daily" | "weekly" | "monthly" | "yearly";
export type TRecurrencePattern =
  | "Every X Days"
  | "Every Weekday"
  | "Every X Weeks"
  | "Every X Weeks on Every Selected Day"
  | "Every X Months on X Day"
  | "Every X Year on X Month on X Day";

export const DEFAULT_USER_ROLES = ["User", "Clerk", "Admin"] as const;

export const DEFAULT_RESOURCES = ["Event", "Room", "User", "Calendar"] as const;

export const DEFAULT_ACTIONS = ["Create", "Read", "Update", "Delete"] as const;

export type SessionRole = (typeof DEFAULT_USER_ROLES)[number];
export type SessionResource = (typeof DEFAULT_RESOURCES)[number];
export type SessionAction = (typeof DEFAULT_ACTIONS)[number];
