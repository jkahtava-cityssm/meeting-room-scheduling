import { GroupedPermissionRequirement } from "@/lib/auth-permission-checks";
import { createClientSecurity } from "@/lib/auth-permission-security-client";
import { createServerSecurity } from "@/lib/auth-permission-security-server";

const PAGE_PERMISSIONS = {
  ViewCalendarDay: { type: "permission", resource: "Calendar", action: "View Day" },
  ViewCalendarWeek: { type: "permission", resource: "Calendar", action: "View Week" },
  ViewCalendarMonth: { type: "permission", resource: "Calendar", action: "View Month" },
  ViewCalendarYear: { type: "permission", resource: "Calendar", action: "View Year" },
  ViewCalendarAgenda: { type: "permission", resource: "Calendar", action: "View Agenda" },
  ViewStaffRequests: { type: "permission", resource: "Calendar", action: "View Staff Requests" },

  ViewMyBookingDay: { type: "permission", resource: "My Bookings", action: "View Day" },
  ViewMyBookingWeek: { type: "permission", resource: "My Bookings", action: "View Week" },
  ViewMyBookingMonth: { type: "permission", resource: "My Bookings", action: "View Month" },
  ViewMyBookingYear: { type: "permission", resource: "My Bookings", action: "View Year" },
  ViewMyBookingAgenda: { type: "permission", resource: "My Bookings", action: "View Agenda" },

  EditPermissions: { type: "permission", resource: "Settings", action: "Edit Permissions" },
  EditRooms: { type: "permission", resource: "Settings", action: "Edit Rooms" },
  EditConfiguration: { type: "permission", resource: "Settings", action: "Edit Configuration" },
  EditUsers: { type: "permission", resource: "Settings", action: "Edit Users" },
} as const satisfies GroupedPermissionRequirement;

export const NavigationPermissions = createClientSecurity(PAGE_PERMISSIONS);
