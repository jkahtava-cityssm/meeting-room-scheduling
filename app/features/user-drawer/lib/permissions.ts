import { GroupedPermissionRequirement } from '@/lib/auth-permission-checks';
import { createClientSecurity } from '@/lib/auth-permission-security-client';

const PAGE_PERMISSIONS = {
  CreateUser: { type: 'permission', resource: 'User', action: 'Create' },
  ReadAllUser: { type: 'permission', resource: 'User', action: 'Read All' },
  ReadSelfUser: { type: 'permission', resource: 'User', action: 'Read Self' },
  UpdateUser: { type: 'permission', resource: 'User', action: 'Update' },
  DeleteUser: { type: 'permission', resource: 'User', action: 'Delete' },
} as const satisfies GroupedPermissionRequirement;

export const UserDrawerPermissions = createClientSecurity(PAGE_PERMISSIONS);
