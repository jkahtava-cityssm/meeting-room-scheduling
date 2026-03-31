import { GroupedPermissionRequirement } from "@/lib/auth-permission-checks";
import { createClientSecurity } from "@/lib/auth-permission-security-client";

const PAGE_PERMISSIONS = {
  ReadAllEvent: { type: "permission", resource: "Event", action: "Read All" },
  UpateEventStatus: { type: "permission", resource: "Event", action: "Change Status" },
  ViewCalendarDay: { type: "permission", resource: "Calendar", action: "View Day" },
  ViewCalendarWeek: { type: "permission", resource: "Calendar", action: "View Week" },
  ViewCalendarMonth: { type: "permission", resource: "Calendar", action: "View Month" },
  ViewCalendarYear: { type: "permission", resource: "Calendar", action: "View Year" },
  ViewCalendarAgenda: { type: "permission", resource: "Calendar", action: "View Agenda" },
  ViewStaffRequests: { type: "permission", resource: "Calendar", action: "View Staff Requests" },
} as const satisfies GroupedPermissionRequirement;

export const BookingPermissions = createClientSecurity(PAGE_PERMISSIONS);
