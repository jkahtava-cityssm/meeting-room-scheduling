import { GroupedPermissionRequirement } from "@/lib/auth-permission-checks";
import { createSecurityContext } from "@/lib/auth-permission-security-context";

const PAGE_PERMISSIONS = {
  CreateEvent: { type: "permission", resource: "Event", action: "Create" },
  ReadAllEvent: { type: "permission", resource: "Event", action: "Read All" },
  ReadSelfEvent: { type: "permission", resource: "Event", action: "Read Self" },
  ViewCalendarDay: { type: "permission", resource: "Calendar", action: "View Day" },
  ViewCalendarWeek: { type: "permission", resource: "Calendar", action: "View Week" },
  ViewCalendarMonth: { type: "permission", resource: "Calendar", action: "View Month" },
  ViewCalendarYear: { type: "permission", resource: "Calendar", action: "View Year" },
  ViewCalendarAgenda: { type: "permission", resource: "Calendar", action: "View Agenda" },
  ViewMyBookingDay: { type: "permission", resource: "My Bookings", action: "View Day" },
  ViewMyBookingWeek: { type: "permission", resource: "My Bookings", action: "View Week" },
  ViewMyBookingMonth: { type: "permission", resource: "My Bookings", action: "View Month" },
  ViewMyBookingYear: { type: "permission", resource: "My Bookings", action: "View Year" },
  ViewMyBookingAgenda: { type: "permission", resource: "My Bookings", action: "View Agenda" },
} as const satisfies GroupedPermissionRequirement;

export const CalendarPermissions = createSecurityContext(PAGE_PERMISSIONS);
