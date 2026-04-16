import { GroupedPermissionRequirement } from '@/lib/auth-permission-checks';
import { createClientSecurity } from '@/lib/auth-permission-security-client';

const PAGE_PERMISSIONS = {
  CreateEvent: { type: 'permission', resource: 'Event', action: 'Create' },
  ReadAllEvent: { type: 'permission', resource: 'Event', action: 'Read All' },
  ReadSelfEvent: { type: 'permission', resource: 'Event', action: 'Read Self' },
  UpdateEvent: { type: 'permission', resource: 'Event', action: 'Update' },
  DeleteEvent: { type: 'permission', resource: 'Event', action: 'Delete' },
  ChangeEventStatus: { type: 'permission', resource: 'Event', action: 'Change Status' },
  ChangeEventUser: { type: 'permission', resource: 'Event', action: 'Change Assigned' },
  ToggleRecurrence: { type: 'permission', resource: 'Event', action: 'Allow Recurrence' },
  ToggleMultiDay: { type: 'permission', resource: 'Event', action: 'Allow Multi-Day' },
  IgnoreHours: { type: 'permission', resource: 'Event', action: 'Ignore Visible Hours' },
  IgnoreBookingSpan: { type: 'permission', resource: 'Event', action: 'Ignore Booking Span' },
  AllowMultiRoom: { type: 'permission', resource: 'Event', action: 'Allow Multiple Rooms' },
} as const satisfies GroupedPermissionRequirement;

export const EventDrawerPermissions = createClientSecurity(PAGE_PERMISSIONS);
