import { guardRoute } from '@/lib/api-guard';
import { InternalServerErrorMessage, SuccessMessage } from '@/lib/api-helpers';
import { findManyProperties } from '@/lib/data/properties';

import { NextRequest } from 'next/server';

export async function GET(req: NextRequest) {
  return guardRoute(
    req,
    { EditRooms: { type: 'permission', resource: 'Settings', action: 'Edit Rooms' } },
    async ({ sessionUserId, permissionCache, permissions, sessionId, data }) => {
      const roomProperties = await findManyProperties();

      if (!roomProperties) {
        return InternalServerErrorMessage();
      }

      return SuccessMessage('Collected Room Properties', roomProperties);
    },
  );
}
