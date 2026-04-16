import { GroupedPermissionRequirement } from '../auth-permission-checks';
import { createServerSecurity } from '../auth-permission-security-server';

const NAVIGATION_PERMISSIONS = {
  ViewStaffRequests: { type: 'permission', resource: 'Calendar', action: 'View Staff Requests' },
  ViewCalendar: {
    type: 'or',
    requirements: [
      { type: 'permission', resource: 'Calendar', action: 'View Day' },
      { type: 'permission', resource: 'Calendar', action: 'View Week' },
      { type: 'permission', resource: 'Calendar', action: 'View Month' },
      { type: 'permission', resource: 'Calendar', action: 'View Year' },
      { type: 'permission', resource: 'Calendar', action: 'View Agenda' },
    ],
  },
  ViewMyBooking: {
    type: 'or',
    requirements: [
      { type: 'permission', resource: 'My Bookings', action: 'View Day' },
      { type: 'permission', resource: 'My Bookings', action: 'View Week' },
      { type: 'permission', resource: 'My Bookings', action: 'View Month' },
      { type: 'permission', resource: 'My Bookings', action: 'View Year' },
      { type: 'permission', resource: 'My Bookings', action: 'View Agenda' },
    ],
  },
  EditPermissions: { type: 'permission', resource: 'Settings', action: 'Edit Permissions' },
  EditRooms: { type: 'permission', resource: 'Settings', action: 'Edit Rooms' },
  EditConfiguration: { type: 'permission', resource: 'Settings', action: 'Edit Configuration' },
  EditUsers: { type: 'permission', resource: 'Settings', action: 'Edit Users' },
} as const satisfies GroupedPermissionRequirement;

export const ServerNavigationPermissions = createServerSecurity(NAVIGATION_PERMISSIONS);
