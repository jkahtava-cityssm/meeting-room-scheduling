import { GroupedPermissionRequirement } from "@/lib/auth-permission-checks";
import { createSecurityContext } from "@/lib/auth-permission-security-context";

const PAGE_PERMISSIONS = {
	CreateEvent: { type: "permission", resource: "Event", action: "Create" },
	ReadAllEvent: { type: "permission", resource: "Event", action: "Read All" },
	ReadSelfEvent: { type: "permission", resource: "Event", action: "Read Self" },
	UpdateEvent: { type: "permission", resource: "Event", action: "Update" },
	DeleteEvent: { type: "permission", resource: "Event", action: "Delete" },
	ChangeEventStatus: { type: "permission", resource: "Event", action: "Change Status" },
	ChangeEventUser: { type: "permission", resource: "Event", action: "Change Assigned" },
	ToggleRecurrence: { type: "permission", resource: "Event", action: "Allow Recurrence" },
	ToggleMultiDay: { type: "permission", resource: "Event", action: "Allow Multi-Day" },
} as const satisfies GroupedPermissionRequirement;

export const EventDrawerPermissions = createSecurityContext(PAGE_PERMISSIONS);
