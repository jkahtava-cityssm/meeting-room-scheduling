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

export const CONFIGURATION_KEYS = [
  "visibleHoursStart",
  "visibleHoursEnd",
  "timeSlotIntervalMinutes",
  "singleSignOnEnabled",
] as const;

export type TConfigurationKeys = (typeof CONFIGURATION_KEYS)[number];

/**
 * Default Roles, Resources, Actions, and Permission Sets
 */

export const DEFAULT_USER_ROLES = ["User", "Clerk", "Admin", "Public", "Private"] as const;
export type SessionRole = (typeof DEFAULT_USER_ROLES)[number];

export const DEFAULT_RESOURCE_ACTIONS = [
  {
    RESOURCE: "Event",
    ACTIONS: ["Read", "Create", "Update", "Delete", "Change Status", "Change Assigned"],
  },
  {
    RESOURCE: "Room",
    ACTIONS: ["Read", "Create", "Update", "Delete", "View Hidden"],
  },
  {
    RESOURCE: "User",
    ACTIONS: ["Read", "Create", "Update", "Delete"],
  },
  {
    RESOURCE: "Calendar",
    ACTIONS: ["Read", "Update", "Delete"],
  },
  {
    RESOURCE: "My Bookings",
    ACTIONS: ["Read", "Update", "Delete"],
  },
  {
    RESOURCE: "Settings",
    ACTIONS: ["Edit Permissions", "Edit Rooms", "Edit Configuration", "Edit Users"],
  },
] as const;

type ResourceActionDefinition = (typeof DEFAULT_RESOURCE_ACTIONS)[number];
export type SessionResource = ResourceActionDefinition["RESOURCE"];
export type SessionAction = ResourceActionDefinition["ACTIONS"][number];

export type DEFAULT_PERMISSION_SET = {
  ROLE: SessionRole;
  SET: DEFAULT_PERMISSION_RESOURCE_SETS[];
};

export type DEFAULT_PERMISSION_RESOURCE_SETS = {
  RESOURCE: SessionResource;
  ACTIONS: SessionAction[];
};

export const DEFAULT_PERMISSION_SETS: DEFAULT_PERMISSION_SET[] = [
  {
    ROLE: "Clerk",
    SET: [
      { RESOURCE: "Event", ACTIONS: ["Read", "Create", "Update", "Delete", "Change Status", "Change Assigned"] },
      { RESOURCE: "Room", ACTIONS: ["Read", "Create", "Update", "Delete", "View Hidden"] },
      { RESOURCE: "User", ACTIONS: ["Read"] },
      { RESOURCE: "Calendar", ACTIONS: ["Read", "Update"] },
      { RESOURCE: "My Bookings", ACTIONS: ["Read", "Update", "Delete"] },
      { RESOURCE: "Settings", ACTIONS: ["Edit Rooms"] },
    ],
  },
  {
    ROLE: "User",
    SET: [
      { RESOURCE: "Event", ACTIONS: ["Read", "Create", "Update"] },
      { RESOURCE: "Room", ACTIONS: ["Read"] },
      { RESOURCE: "User", ACTIONS: [] },
      { RESOURCE: "Calendar", ACTIONS: [] },
      { RESOURCE: "My Bookings", ACTIONS: ["Read", "Update"] },
      { RESOURCE: "Settings", ACTIONS: [] },
    ],
  },
];
