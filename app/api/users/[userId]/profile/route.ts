import { guardRoute } from '@/lib/api-guard';
import { BadRequestMessage, NoContentMessage, SuccessMessage } from '@/lib/api-helpers';
import { findFirstUserProfile } from '@/lib/data/users';
import { NextRequest } from 'next/server';

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
      ],
    },

    async ({ sessionUserId, permissionCache, permissions, sessionId }) => {
      const { userId } = await params;

      if (!userId || isNaN(Number(userId))) {
        return BadRequestMessage();
      }

      const user = await findFirstUserProfile(Number(userId));

      if (!user) {
        return NoContentMessage();
      }

      return SuccessMessage('Collected Profile', user);
    },
  );
}
