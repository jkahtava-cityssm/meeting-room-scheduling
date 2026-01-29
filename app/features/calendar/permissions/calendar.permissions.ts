import { createSecurityContext } from "@/lib/auth-permission-security-context";

const PAGE_PERMISSIONS = {
  CreateEvent: { type: "permission", resource: "Event", action: "Create" },
  AllowDayView: { type: "permission", resource: "Calendar", action: "View Day" },
  AllowWeekView: { type: "permission", resource: "Calendar", action: "View Week" },
  AllowMonthView: { type: "permission", resource: "Calendar", action: "View Month" },
  AllowYearView: { type: "permission", resource: "Calendar", action: "View Year" },
  AllowAgendaView: { type: "permission", resource: "Calendar", action: "View Agenda" },
} as const;

export const CalendarPermissions = createSecurityContext(PAGE_PERMISSIONS);
