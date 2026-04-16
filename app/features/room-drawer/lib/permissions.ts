import { GroupedPermissionRequirement } from '@/lib/auth-permission-checks';
import { createClientSecurity } from '@/lib/auth-permission-security-client';

const PAGE_PERMISSIONS = {
  CreateRoom: { type: 'permission', resource: 'Room', action: 'Create' },
  ReadAllRoom: { type: 'permission', resource: 'Room', action: 'Read' },
  UpdateRoom: { type: 'permission', resource: 'Room', action: 'Update' },
  DeleteRoom: { type: 'permission', resource: 'Room', action: 'Delete' },
} as const satisfies GroupedPermissionRequirement;

export const RoomDrawerPermissions = createClientSecurity(PAGE_PERMISSIONS);
