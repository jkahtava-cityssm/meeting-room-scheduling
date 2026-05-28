// app/api/internal/sso/register-microsoft/route.ts
import { NextRequest } from 'next/server';

import { guardRoute } from '@/lib/api-guard';
import { getServerSession } from '@/lib/auth';

import { BadRequestMessage, DeleteMessage, SuccessMessage } from '@/lib/api-helpers';
import { prisma } from '@/prisma';

import { updateSession } from '@/lib/data/permissions';

export async function POST(req: NextRequest) {
  return guardRoute(
    req,
    { EditPermission: { type: 'permission', resource: 'Settings', action: 'Edit Permissions' } },
    async ({ sessionUserId, sessionId }) => {
      const { roleId } = await req.json();

      if (!roleId || !sessionId) {
        return BadRequestMessage();
      }

      const roleName = await prisma.role.findFirst({
        select: { name: true },
        where: { roleId: Number(roleId) },
        orderBy: { roleId: 'asc' },
      });

      const session = await updateSession({ sessionId, impersonatedRole: roleName?.name }, sessionUserId);

      return SuccessMessage('Created Impersonation', {
        sessionId: session.id,
        impersonatedRole: session.impersonatedRole,
      });
    },
  );
}

export async function DELETE(req: NextRequest) {
  const session = await getServerSession();

  return guardRoute(
    req,
    { isImpersonating: { type: 'function', check: () => Boolean(session?.session?.impersonatedRole) } },
    async ({ sessionUserId, sessionId }) => {
      if (!sessionId) {
        return BadRequestMessage();
      }

      await updateSession({ sessionId, impersonatedRole: undefined }, sessionUserId);

      return DeleteMessage();
    },
  );
}
