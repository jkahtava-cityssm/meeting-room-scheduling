import { guardRoute } from '@/lib/api-guard';
import {
  BadRequestMessage,
  CreatedMessage,
  DeleteMessage,
  InternalServerErrorMessage,
  NoContentMessage,
  NotFoundMessage,
  SuccessMessage,
} from '@/lib/api-helpers';
import { findManyUsersWithRoles, upsertUserRole } from '@/lib/data/users';
import { prisma } from '@/prisma';
import { Prisma } from '@prisma/client';
import { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  return guardRoute(
    request,
    { EditPermission: { type: 'permission', resource: 'Settings', action: 'Edit Permissions' } },

    async ({ sessionUserId, permissionCache, permissions, sessionId }) => {
      const searchParams = request.nextUrl.searchParams;

      const roleId = searchParams.get('roleId');

      if (!roleId) {
        return BadRequestMessage();
      }

      const users = await findManyUsersWithRoles(Number(roleId));

      if (!users) {
        return NotFoundMessage();
      }

      return SuccessMessage('Collected Users', users);
    },
  );
}

export async function PUT(request: NextRequest) {
  return guardRoute(
    request,
    {
      EditPermission: { type: 'permission', resource: 'Settings', action: 'Edit Permissions' },
    },
    async ({ sessionUserId }) => {
      const body = await request.json().catch(() => null);
      const userId = Number(body?.userId);
      const roleId = Number(body?.roleId);
      const assignRole: boolean | undefined = body?.assignRole;

      if (!Number.isFinite(userId) || !Number.isFinite(roleId) || typeof assignRole !== 'boolean') {
        return BadRequestMessage();
      }

      try {
        const userRole = await upsertUserRole({ userId, roleId, granted: assignRole }, sessionUserId);

        return SuccessMessage(assignRole ? 'User role granted.' : 'User role revoked.', userRole);
      } catch (e: unknown) {
        return InternalServerErrorMessage('Failed to update user role.');
      }
    },
  );
}
