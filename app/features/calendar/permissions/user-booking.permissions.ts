import { createSecurityContext } from "@/lib/auth-permission-security-context";

const PAGE_PERMISSIONS = {
  CreateEvent: { type: "permission", resource: "Event", action: "Create" },
  ReadAllEvent: { type: "permission", resource: "Event", action: "Read All" },
  ReadSelfEvent: { type: "permission", resource: "Event", action: "Read Self" },
  AllowDayView: { type: "permission", resource: "My Bookings", action: "View Day" },
  AllowWeekView: { type: "permission", resource: "My Bookings", action: "View Week" },
  AllowMonthView: { type: "permission", resource: "My Bookings", action: "View Month" },
  AllowYearView: { type: "permission", resource: "My Bookings", action: "View Year" },
  AllowAgendaView: { type: "permission", resource: "My Bookings", action: "View Agenda" },
} as const;

export const UserBookingPermissions = createSecurityContext(PAGE_PERMISSIONS);
