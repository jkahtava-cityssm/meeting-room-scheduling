export type TCalendarView = "day" | "week" | "month" | "year" | "agenda" | "public" | "all";
export type TStatusKey = "PENDING" | "APPROVED" | "REJECTED" | "INFORMATION";
export const colorOptions = [
  "red",
  "rose",
  "razzmatazz",
  "pink",
  "japonica",
  "orange",
  "amber",
  "yellow",
  "manz",
  "harvestGold",
  "lime",
  "sulu",
  "malachite",
  "camarone",
  "green",
  "emerald",
  "watercourse",
  "teal",
  "cyan",
  "scooter",
  "disabled",
  "sky",
  "blue",
  "havelockBlue",
  "indigo",
  "violet",
  "purple",
  "fuchsia",
  "viola",
  "slate",
  "zinc",
  "invisible",
] as const;

export type TColors = (typeof colorOptions)[number];

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

export const DEFAULT_USER_ROLES = ["User", "Clerk", "Admin", "Public", "Private"] as const;

export const DEFAULT_RESOURCES = ["Event", "Room", "User", "Calendar", "My Bookings", "Settings"] as const;

export const DEFAULT_ACTIONS = [
  "Create",
  "Read",
  "Update",
  "Delete",
  "Change Status",
  "Change Assigned",
  "View Hidden",
  "Edit Permissions",
  "Edit Rooms",
  "Edit Users",
] as const;

export type SessionRole = (typeof DEFAULT_USER_ROLES)[number];
export type SessionResource = (typeof DEFAULT_RESOURCES)[number];
export type SessionAction = (typeof DEFAULT_ACTIONS)[number];

export type DEFAULT_PERMISSION_SETS = {
  ROLE: SessionRole;
  SET: { RESOURCE: SessionResource; ACTIONS: SessionAction[] }[];
};

const test: DEFAULT_PERMISSION_SETS = {
  ROLE: "User",
  SET: [{ RESOURCE: "Event", ACTIONS: ["Read", "Create", "Update", "Delete", "Change Status", "Change Assigned"] }],
};

export const CONFIGURATION_KEYS = [
  "visibleHoursStart",
  "visibleHoursEnd",
  "timeSlotIntervalMinutes",
  "SingleSignOnEnabled",
] as const;

export type TConfigurationKeys = (typeof CONFIGURATION_KEYS)[number];
