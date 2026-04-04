import { createUser, deleteManyUsers, findManyUsers, upsertUser } from '@/lib/data/users';

import { NextRequest } from 'next/server';

import { BadRequestMessage, CreatedMessage, DeleteMessage, InternalServerErrorMessage, SuccessMessage } from '@/lib/api-helpers';

import { guardRoute } from '@/lib/api-guard';
import { SUserPUT } from '@/lib/services/users';
import { prisma } from '@/prisma';

export async function GET(request: NextRequest, { params }: { params: Promise<{ userId: string }> }) {
  return guardRoute(
    request,
    {
      AnyOf: [
        {
          ReadUsers: {
            type: 'or',
            requirements: [
              { type: 'permission', resource: 'User', action: 'Read All' },
              { type: 'permission', resource: 'User', action: 'Read Self' },
            ],
          },
        },
        { EditUsers: { type: 'permission', resource: 'Settings', action: 'Edit Users' } },
      ],
    },

    async ({ sessionUserId, permissionCache, permissions, sessionId }) => {
      const { userId } = await params;

      if (!userId || isNaN(Number(userId))) {
        return BadRequestMessage();
      }

      const user = await findManyUsers({ id: parseInt(userId) });

      if (!user) {
        return InternalServerErrorMessage();
      }

      return SuccessMessage('Collected User', user);
    },
  );
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ userId: string }> }) {
  return guardRoute(
    request,
    {
      AnyOf: [
        {
          DeleteUser: { type: 'permission', resource: 'User', action: 'Delete' },
        },
        { EditUsers: { type: 'permission', resource: 'Settings', action: 'Edit Users' } },
      ],
    },

    async ({ sessionUserId, permissionCache, permissions, sessionId }) => {
      const { userId } = await params;
      if (!userId || isNaN(Number(userId))) {
        return BadRequestMessage();
      }

      const totalDeleted = await deleteManyUsers({ id: parseInt(userId) });

      if (!totalDeleted) {
        return InternalServerErrorMessage();
      }

      return DeleteMessage();
    },
  );
}
