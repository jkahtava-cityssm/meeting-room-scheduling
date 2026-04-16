import { BadRequestMessage, InternalServerErrorMessage, SuccessMessage } from '@/lib/api-helpers';
import { getServerSession } from '@/lib/auth';
import { prisma } from '@/prisma';
import { findManyStatus } from '@/lib/data/status';
import { guardRoute } from '@/lib/api-guard';
import { NextRequest } from 'next/server';

export async function GET(req: NextRequest) {
  return guardRoute(
    req,
    { IsPublic: { type: 'role', role: 'Public' } },

    async ({ sessionUserId, permissionCache, permissions, sessionId }) => {
      const status = await findManyStatus();

      if (!status) {
        return InternalServerErrorMessage();
      }

      return SuccessMessage('Collected Status', status);
    },
  );
}
